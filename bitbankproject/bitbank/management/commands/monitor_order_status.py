import json
import logging
import os
from datetime import datetime
import time

from django.core.management.base import BaseCommand
from django.template.loader import get_template

from ...models import Relation, Order
from ...myexceptions import *

class Command(BaseCommand):
    help = '注文のステータスを更新します'
    def handle(self, *args, **options):
        logger = logging.getLogger('monitor_order_status')
        logger.info('started')
        time_started = time.time()
        n = 0
        while True:
            time.sleep(1)
            n = n + 1
            time_elapsed = time.time() - time_started
            if time_elapsed > 57.0:
                break;
            relations = Relation.objects.filter(is_active = True, is_locked = False)
            for relation in relations:
                o_1 = relation.order_1
                o_2 = relation.order_2
                o_3 = relation.order_3

                # 注文１を更新
                if o_1 != None:
                    # 発注済、未約定の時
                    if o_1.status in {Order.STATUS_PARTIALLY_FILLED, Order.STATUS_UNFILLED}:
                        try:
                            o_1.update()
                        except OrderStatusUpdateError as e:
                            logger.error( '注文番号{order_id}の注文ステータスの更新に失敗しました：{error}'.format(order_id = o_1.order_id, error = str(e.args)))
                        else:
                            # ステータス更新成功
                            # 約定済みであった場合
                            if o_1.status == Order.STATUS_FULLY_FILLED: 
                                # single注文であった場合
                                if relation.special_order == Relation.ORDER_SINGLE:
                                    # 特殊注文完了
                                    relation.order_1 = None
                                    relation.is_active = False
                                    relation.save()

                                # IFDであった場合はSINGLE注文へ変更
                                elif relation.special_order == Relation.ORDER_IFD:
                                    # single注文へ変更
                                    relation.special_order = Relation.ORDER_SINGLE
                                    relation.order_1 = o_2
                                    relation.order_2 = None
                                    relation.save()

                                    # ストップ注文かトレールの場合、監視モードへ
                                    if 'stop' in o_2.order_type or 'trail' in o_2.order_type:
                                        o_2.status = Order.STATUS_READY_TO_ORDER
                                        o_2.save()
                                    # 即時注文系はそのまま注文
                                    else:
                                        o_2.place()
                                        if o_2.status == Order.STATUS_FAILED_TO_ORDER:
                                            # 注文失敗時
                                            logger.error( 'pk:{pk}の注文に失敗しました：{error}'.format(pk = o_2.pk, error = o_2.error_message ))
                                            relation.order_1 = None
                                            relation.is_active = False
                                            relation.save()
                                        else:
                                            # 注文成功時
                                            pass

                                # IFDOCOであった場合はOCOへ変更
                                elif relation.special_order == Relation.ORDER_IFDOCO:
                                    relation.special_order = Relation.ORDER_OCO
                                    relation.order_1 = None
                                    relation.save()
                                    
                                    # 注文2がストップ注文もしくはトレール注文の場合は監視モードへ
                                    if 'stop' in o_2.order_type or 'trail' in o_2.order_type:
                                        o_2.status = Order.STATUS_READY_TO_ORDER
                                        o_2.save()
                                    # 即時注文の場合
                                    else:
                                        o_2.place()

                                    # order_3が即時注文でない場合は監視モードへ
                                    if 'stop' in o_3.order_type or 'trail' in o_3.order_type:
                                        o_3.status = Order.STATUS_READY_TO_ORDER
                                        o_3.save()
                                    else:
                                        # 即時注文の場合h
                                        o_3.place()
                                    
                                    if o_2.status == Order.STATUS_FAILED_TO_ORDER:
                                        # 注文失敗時、他方のシングル注文に変更する
                                        logger.error( 'pk:{pk}の注文に失敗しました：{error}'.format(pk = o_2.pk, error = o_2.error_message) )
                                        relation.special_order = Relation.ORDER_SINGLE
                                        relation.order_1 = o_3
                                        relation.order_2 = None
                                        relation.save()
                                        if o_3.status == Order.STATUS_FAILED_TO_ORDER:
                                            # order_2も3も失敗した場合は無効化
                                            relation.is_active = False
                                            relation.order_1 = None
                                            relation.save()
                                    else:
                                        if o_3.status == Order.STATUS_FAILED_TO_ORDER:
                                            relation.special_order = Relation.ORDER_SINGLE
                                            relation.order_1 = o_2
                                            relation.order_3 = None
                                            relation.save()
                                if relation.user.notify_if_filled == 'ON':
                                    # 約定通知メール
                                    o_1.notify_user()

                            # 本家でキャンセルされていた場合は特殊注文を無効化
                            elif o_1.status in {Order.STATUS_CANCELED_PARTIALLY_FILLED, Order.STATUS_CANCELED_UNFILLED }:
                                # IFD系の場合は後続をキャンセルし、無効化
                                if relation.special_order in { Relation.ORDER_IFD, Relation.ORDER_IFDOCO }:
                                    try:
                                        relation.order_2.cancel()
                                    except OrderCancelFailedError:
                                        pass
                                # IFDOCOの場合は注文3もキャンセル
                                if relation.special_order == Relation.ORDER_IFDOCO:
                                    try:
                                        relation.order_3.cancel()
                                    except OrderCancelFailedError:
                                        pass
                                relation.order_1 = None
                                relation.order_2 = None
                                relation.order_3 = None
                                relation.is_active = False
                                relation.save()
            
                    # それ以外の場合は何もしない
                    else:
                        pass 

                # 注文2を更新
                if o_2 != None:
                    # 発注済み、未約定の時
                    if o_2.status in {Order.STATUS_UNFILLED, Order.STATUS_PARTIALLY_FILLED}:
                        try:
                            o_2.update()
                        except OrderStatusUpdateError as e:
                            logger.error( '注文番号{order_id}の注文ステータスの更新に失敗しました：{error}'.format(order_id = o_2.order_id, error = str(e.args)))
                        else:
                            # 注文2が約定済みであった場合注文３をキャンセル
                            if o_2.status  == Order.STATUS_FULLY_FILLED:
                                # OCOの場合     
                                if relation.special_order == Relation.ORDER_OCO:
                                    try:
                                        o_3.cancel()
                                    except OrderCancelFailedError as e:
                                        logger.error( '注文:{order_id}のキャンセルに失敗しました。{error}'.format(order_id = o_3.order_id, error = str(e.args)) )
                                    finally:
                                        # 特殊注文を無効化
                                        relation.order_2 = None
                                        relation.order_3 = None
                                        relation.is_active = False
                                        relation.save()
                                
                                if relation.user.notify_if_filled == 'ON':
                                    # 約定通知メール
                                    o_2.notify_user()
                            # 本家でキャンセルされていた場合、注文３のSINGLEへ変更
                            elif o_2.status in { Order.STATUS_CANCELED_PARTIALLY_FILLED, Order.STATUS_CANCELED_UNFILLED }:
                                
                                relation.order_1 = o_3
                                relation.order_2 = None
                                relation.order_3 = None
                                relation.special_order = 'SINGLE'
                                relation.save()
                   
                # 注文3を更新
                if o_3 != None:
                    # 発注済、未約定の時
                    if o_3.status in {Order.STATUS_UNFILLED, Order.STATUS_PARTIALLY_FILLED}:
                        try:
                            o_3.update()
                        except OrderStatusUpdateError as e:
                            logger.error( '注文番号{order_id}の注文ステータスの更新に失敗しました：{error}'.format(order_id = o_3.order_id, error = str(e.args)))
                        else:
                            # 更新後約定図であった場合
                            if o_3.status  == Order.STATUS_FULLY_FILLED:
                                # OCOの場合は注文2をキャンセル
                                if relation.special_order == Relation.ORDER_OCO:
                                    try:
                                        o_2.cancel()
                                    except OrderCancelFailedError as e:
                                        logger.error( '注文:{order_id}のキャンセルに失敗しました。{error}'.format(order_id = o_2.order_id, error = str(e.args)) )
                                    finally:
                                        # 特殊注文を無効化
                                        relation.order_2 = None
                                        relation.order_3 = None
                                        relation.is_active = False
                                        relation.save()
                                if relation.user.notify_if_filled == 'ON':
                                    # 約定通知メール
                                    o_3.notify_user()

                            # 本家でキャンセル済みであった場合は注文２のsingle注文へ
                            elif o_3.status in {Order.STATUS_CANCELED_PARTIALLY_FILLED, Order.STATUS_CANCELED_UNFILLED}:
                                relation.order_1 = o_2
                                relation.order_2 = None
                                relation.order_3 = None
                                relation.special_order = 'SINGLE'
                                relation.save()
        logger.info('completed')
