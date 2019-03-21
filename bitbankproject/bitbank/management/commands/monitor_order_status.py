import json
import logging
import os
from datetime import datetime
import time
import python_bitbankcc
from django.core.management.base import BaseCommand
from django.template.loader import get_template

from ...models import Relation, Order, User


class Command(BaseCommand):
    # python manage.py help count_entryで表示されるメッセージ
    help = '注文のステータスを更新します'
    # コマンドが実行された際に呼ばれるメソッド
    def handle(self, *args, **options):
        logger = logging.getLogger('batch_logger')
        #logger.info('started')
        time_started = time.time()
        n = 0
        while True:
            time.sleep(1)
            n = n + 1
            time_elapsed = time.time() - time_started
            if time_elapsed > 57.0:
                break;
            for user in User.objects.all():
                #logger.info(user.full_name)
                # API KEYが登録されているユーザのみ処理
                if (user.api_key == "" or user.api_key == None) or (user.api_secret_key == "" or user.api_secret_key == None):
                    # キー情報セット
                    continue
		    
                try:
                    prv = python_bitbankcc.private(user.api_key, user.api_secret_key)
                except Exception as e:
                    logger.error('user:' + user.email + ' message: ' +  str(e.args))
                    continue
                active_orders = Relation.objects.filter(user = user).filter(is_active=True)
                for order in active_orders:
                    o_1 = order.order_1
                    o_2 = order.order_2
                    o_3 = order.order_3

                    # Order#1が存在し、未約定の場合
                    if o_1 != None and o_1.status in {Order.STATUS_UNFILLED, Order.STATUS_PARTIALLY_FILLED}:
                        status = o_1.update(prv)
                        #logger.info('o_1 found ' + str(o_1.order_id) + ' status:' + str(status))
            
                        if status == Order.STATUS_FULLY_FILLED: 
                            order.order_1 = None
                            if o_2 != None and o_2.status in {Order.STATUS_WAIT_OTHER_ORDER_TO_FILL}:
                                order.special_order = 'SINGLE'

                                if 'stop' in o_2.order_type:
                                    o_2.status = Order.STATUS_READY_TO_ORDER
                                else:
                                    if not o_2.place(prv):
                                        if o_3 != None:
                                            if o_3.status in {Order.STATUS_PARTIALLY_FILLED, Order.STATUS_UNFILLED}:
                                                o_3.cancel(prv)
                                            else:
                                                o_3.status = Order.STATUS_CANCELED_UNFILLED
                    
                                       
                            if o_3 != None and o_3.status in {Order.STATUS_WAIT_OTHER_ORDER_TO_FILL}:
                                order.special_order = 'OCO'
                                if 'stop' in o_3.order_type:
                                    o_3.status = Order.STATUS_READY_TO_ORDER
                                else:
                                    if not o_3.place(prv):
                                        if o_2 != None:
                                            if o_2.status in {Order.STATUS_PARTIALLY_FILLED, Order.STATUS_UNFILLED}:
                                                o_2.cancel(prv)
                                            else:
                                                o_2.status = Order.STATUS_CANCELED_UNFILLED
                            

                            if user.notify_if_filled == 'ON':
                                # 約定通知メール
                                o_1.notify_user()

                        # 本家でキャンセルされていた場合
                        elif status in {Order.STATUS_CANCELED_PARTIALLY_FILLED, Order.STATUS_CANCELED_UNFILLED, Order.STATUS_FAILED_TO_ORDER}:
                            if o_2 != None and o_2.status in {Order.STATUS_WAIT_OTHER_ORDER_TO_FILL}:
                                o_2.status = Order.STATUS_CANCELED_UNFILLED
                            if o_3 != None and o_3.status in {Order.STATUS_WAIT_OTHER_ORDER_TO_FILL}:
                                o_3.status = Order.STATUS_CANCELED_UNFILLED

                    if o_2 != None and o_2.status in {Order.STATUS_UNFILLED, Order.STATUS_PARTIALLY_FILLED}:
                        status = o_2.update(prv)
                        if status  == Order.STATUS_FULLY_FILLED:
                            # order_3のキャンセル
                            if o_3 != None:
                                if o_3.status in {Order.STATUS_UNFILLED, Order.STATUS_PARTIALLY_FILLED}:
                                    o_3.cancel(prv)
                                else:
                                    o_3.status = Order.STATUS_CANCELED_UNFILLED

                            if user.notify_if_filled == 'ON':
                                # 約定通知メール
                                o_2.notify_user()

                        elif status in {Order.STATUS_CANCELED_PARTIALLY_FILLED, Order.STATUS_CANCELED_UNFILLED}:
                            if o_3 != None:
                                order.order_2 = o_3
                                order.order_3 = None
                                order.special_order = 'SINGLE'

                    if o_3 != None and o_3.status in {Order.STATUS_UNFILLED, Order.STATUS_PARTIALLY_FILLED}:
                        status = o_3.update(prv)
                        if status  == Order.STATUS_FULLY_FILLED:
                            # order_2のキャンセル
                            if o_2 != None:
                                if o_2.status in {Order.STATUS_PARTIALLY_FILLED, Order.STATUS_UNFILLED}:
                                    o_2.cancel(prv)
                                else:
                                    o_2.status = Order.STATUS_CANCELED_UNFILLED
                                    
                            if user.notify_if_filled == 'ON':
                                # 約定通知メール
                                o_3.notify_user()
                        elif status in {Order.STATUS_CANCELED_PARTIALLY_FILLED, Order.STATUS_CANCELED_UNFILLED}:
                            if o_2 != None:
                                order.order_3 = None
                                order.special_order = 'SINGLE'

                    if (o_1 == None or o_1.status in {Order.STATUS_FULLY_FILLED, Order.STATUS_CANCELED_UNFILLED, Order.STATUS_CANCELED_PARTIALLY_FILLED, Order.STATUS_FAILED_TO_ORDER}) \
                        and (o_2 == None or o_2.status in {Order.STATUS_FULLY_FILLED, Order.STATUS_CANCELED_UNFILLED, Order.STATUS_CANCELED_PARTIALLY_FILLED, Order.STATUS_FAILED_TO_ORDER}) \
                        and (o_3 == None or o_3.status in {Order.STATUS_FULLY_FILLED, Order.STATUS_CANCELED_UNFILLED, Order.STATUS_CANCELED_PARTIALLY_FILLED, Order.STATUS_FAILED_TO_ORDER}):
                        order.is_active = False
                    if o_1 != None:
                        o_1.save()
                    if o_2 != None:
                        o_2.save()
                    if o_3 != None:
                        o_3.save()
                    order.save()

        #logger.info('completed')
