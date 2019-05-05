import json
import logging
import os
import traceback

import python_bitbankcc
from .coincheck.coincheck import CoinCheck
from django import forms, http
from django.conf import settings
from django.contrib import messages
from django.contrib.auth import authenticate, get_user_model
from django.contrib.auth.mixins import LoginRequiredMixin, UserPassesTestMixin
from django.contrib.auth.views import (LoginView, LogoutView,
                                       PasswordChangeDoneView,
                                       PasswordChangeView,
                                       PasswordResetCompleteView,
                                       PasswordResetConfirmView,
                                       PasswordResetDoneView,
                                       PasswordResetView)
from django.contrib.sites.shortcuts import get_current_site
from django.core import serializers
from django.core.mail import EmailMultiAlternatives, send_mail
from django.core.signing import BadSignature, SignatureExpired, dumps, loads
from django.forms.utils import ErrorList
from django.http import Http404, HttpResponseBadRequest, JsonResponse
from django.shortcuts import redirect, resolve_url
from django.template.loader import get_template
from django.urls import reverse, reverse_lazy
from django.utils import timezone
from django.views import generic

from .forms import (LoginForm, MyPasswordChangeForm, MyPasswordResetForm,
                    MySetPasswordForm, UserCreateForm, UserUpdateForm)
from .models import (Alert, Attachment, Order, Inquiry, Relation,
                     User)
from .serializer import *

class Login(LoginView):
    """ログインページ"""
    form_class = LoginForm
    template_name = 'bitbank/login.html'

class Logout(LoginRequiredMixin, LogoutView):
    """ログアウトページ"""
    template_name = 'bitbank/top.html'

class OnlyYouMixin(UserPassesTestMixin):
    raise_exception = True

    def test_func(self):
        user = self.request.user
        return user.pk == self.kwargs['pk'] or user.is_superuser

class UserCreate(generic.CreateView):
    """ユーザー仮登録"""
    template_name = 'bitbank/user_create.html'
    form_class = UserCreateForm

    def form_valid(self, form):
        """仮登録と本登録用メールの発行."""
        # 仮登録と本登録の切り替えは、is_active属性を使うと簡単です。
        # 退会処理も、is_activeをFalseにするだけにしておくと捗ります。
        user = form.save(commit=False)
        user.is_active = False
        user.save()

        # アクティベーションURLの送付
        current_site = get_current_site(self.request)
        domain = current_site.domain

        bankinfo = BankInfo.get_bank_info()

        context = {
            'protocol': self.request.scheme,
            'domain': domain,
            'token': dumps(user.pk),
            'user': user,
            'bank': bankinfo.bank,
            'branch': bankinfo.branch,
            'meigi': bankinfo.meigi,
            'type': bankinfo.type,
            'number': bankinfo.number
        }

        subject = get_template('bitbank/mail_template/create/subject.txt').render(context)
        message = get_template('bitbank/mail_template/create/message.txt').render(context)
        subject_for_admin =  get_template('bitbank/mail_template/create_to_admin/subject.txt').render(context)
        message_for_admin = get_template('bitbank/mail_template/create_to_admin/message.txt').render(context)

        user.email_user(subject, message)
        for su in User.objects.filter(is_superuser = True):
            su.email_user(subject_for_admin, message_for_admin)

        return redirect('bitbank:user_create_done')


class UserCreateDone(generic.TemplateView):
    """ユーザー仮登録したよ"""
    template_name = 'bitbank/user_create_done.html'


class UserCreateComplete(generic.TemplateView):
    """メール内URLアクセス後のユーザー本登録"""
    template_name = 'bitbank/user_create_complete.html'
    timeout_seconds = getattr(settings, 'ACTIVATION_TIMEOUT_SECONDS', 60*60*24)  # デフォルトでは1日以内

    def get(self, request, **kwargs):
        """tokenが正しければ本登録."""
        token = kwargs.get('token')
        try:
            user_pk = loads(token, max_age=self.timeout_seconds)

        # 期限切れ
        except SignatureExpired:
            return HttpResponseBadRequest()

        # tokenが間違っている
        except BadSignature:
            return HttpResponseBadRequest()

        # tokenは問題なし
        else:
            try:
                user = User.objects.get(pk=user_pk)
            except User.DoesNotExist:
                return HttpResponseBadRequest()
            else:
                if not user.is_active:
                    # 問題なければ本登録とする
                    user.is_active = True
                    user.save()
                    return super().get(request, **kwargs)

        return HttpResponseBadRequest()

class PasswordChange(PasswordChangeView):
    """パスワード変更ビュー"""
    form_class = MyPasswordChangeForm
    success_url = reverse_lazy('bitbank:password_change_done')
    template_name = 'bitbank/password_change.html'


class PasswordChangeDone(PasswordChangeDoneView):
    """パスワード変更しました"""
    template_name = 'bitbank/password_change_done.html'

class PasswordReset(PasswordResetView):
    """パスワード変更用URLの送付ページ"""
    subject_template_name = 'bitbank/mail_template/password_reset/subject.txt'
    email_template_name = 'bitbank/mail_template/password_reset/message.txt'
    template_name = 'bitbank/password_reset_form.html'
    form_class = MyPasswordResetForm
    success_url = reverse_lazy('bitbank:password_reset_done')


class PasswordResetDone(PasswordResetDoneView):
    """パスワード変更用URLを送りましたページ"""
    template_name = 'bitbank/password_reset_done.html'


class PasswordResetConfirm(PasswordResetConfirmView):
    """新パスワード入力ページ"""
    form_class = MySetPasswordForm
    success_url = reverse_lazy('bitbank:password_reset_complete')
    template_name = 'bitbank/password_reset_confirm.html'


class PasswordResetComplete(PasswordResetCompleteView):
    """新パスワード設定しましたページ"""
    template_name = 'bitbank/password_reset_complete.html'

class MainPage(LoginRequiredMixin, generic.TemplateView):
    """メインページ"""
    template_name = 'bitbank/order.html'

    def get_context_data(self, **kwargs):
        context = super(MainPage, self).get_context_data(**kwargs)
        context['notify_if_filled'] = User.objects.filter(pk=self.request.user.pk).get().notify_if_filled
        return context

def change_notify_if_filled(request):
    if request.user.is_anonymous or request.user.is_active == False:
        return JsonResponse({'error' : 'authentication failed'}, status=401)
    
    user = request.user
    if request.method == 'POST':
        try:
            val = request.POST.get('notify_if_filled')
            user.notify_if_filled = val
            user.save()
            return JsonResponse({'success': True})
        except Exception as e:
            return JsonResponse({'error': str(e.args)})

def change_use_alert(request):
    if request.user.is_anonymous or request.user.is_active == False:
        return JsonResponse({'error' : 'authentication failed'}, status=401)
    
    user = request.user
    if request.method == 'POST':
        try:
            val = request.POST.get('use_alert')
            user.use_alert = val
            user.save()
            return JsonResponse({'success': True})
        except Exception as e:
            return JsonResponse({'error': str(e.args)})


def ajax_user(request):
    if request.user.is_anonymous or request.user.is_active == False:
        return JsonResponse({'error' : 'authentication failed'}, status=401)

    method = request.method
    user = request.user

    if method == 'GET':
        serizlized = UserSerializer(request.user, many=False).data
        
        return JsonResponse(serizlized)

    elif method == 'POST':
        print(request.POST)
        serializer = UserSerializer(user, data = request.POST)
        if serializer.is_valid():
            serializer.save()
            return JsonResponse({'success': True}) 
        else:
            return JsonResponse({'error': serializer.errors})
           
def ajax_alerts(request):
    if request.user.is_anonymous or request.user.is_active == False:
        return JsonResponse({'error' : 'authentication failed'}, status=401)

    user = request.user
    method = request.method

    if method == 'GET':

        offset = int(request.GET.get('offset'))
        to = int(request.GET.get('limit')) + offset
        search_market = request.GET.get('market')
        search_pair = request.GET.get('pair')

        alerts = Alert.objects.filter(user=user).filter(is_active=True)

        
        if search_market != 'all':
            alerts = alerts.filter(market=search_market)
        if search_pair != 'all':
            alerts = alerts.filter(pair=search_pair)
            
        data = {
            'total_count': alerts.count(),
            'data': AlertSerializer(alerts.order_by('-pk')[offset:to], many=True ).data
        }
        return JsonResponse(data)
    elif method == 'POST':
        op = request.POST.get('method')
        if op == 'DELETE':
            pk = request.POST.get('pk')
            try:
                Alert.objects.filter(pk=pk).update(is_active=False)
                return JsonResponse({'success': True})
            except Exception as e:
                traceback.print_exc()
                return JsonResponse({'error': e.args})
        elif op == 'POST':
            #print(request.POST)
            serializer = AlertSerializer(data = request.POST, context={'user': user})
            if serializer.is_valid():
                serializer.save()
                return JsonResponse({'success': True})
            else:
                print(str(serializer.errors) + " gttetetet")
                return JsonResponse({'error': _get_error_message(serializer.errors, '') })
def ajax_ticker(request):
    if request.user.is_anonymous or request.user.is_active == False:
        return JsonResponse({'error' : 'authentication failed'}, status=401)

    if request.method == 'GET':
        market = request.GET.get('market');
        pair = request.GET.get('pair')
        
        try:
            res = python_bitbankcc.public().get_ticker(pair) if market == 'bitbank' else json.loads(CoinCheck('fake', 'fake').ticker.all())
            print(type(res))
        except Exception as e:
            res = {
                'error': e.args
            }
            print(e.args)
        return JsonResponse(res)

def ajax_assets(request):
    logger = logging.getLogger('api')

    if request.user.is_anonymous or request.user.is_active == False:
        return JsonResponse({'error' : 'authentication failed'}, status=401)

    if request.method == 'GET':
        try:
            user = request.user
            market = request.GET.get('market')
            if market == 'bitbank':
                if user.bb_api_key == None or user.bb_api_secret_key == None:
                    res_dict = {
                        'error': 'bitbankのAPI KEYが登録されていません'
                    }
                else:
                    res_dict = python_bitbankcc.private(user.bb_api_key, user.bb_api_secret_key).get_asset()
                    
            elif market == 'coincheck':
                if user.cc_api_key == None or user.cc_api_secret_key == None:
                    res_dict = {
                        'error': 'coincheckのAPI KEYが登録されていません'
                    }
                else:
                    res_dict = json.loads(CoinCheck(user.cc_api_key, user.cc_api_secret_key).account.balance({}))
            return JsonResponse(res_dict)
        except Exception as e:
            logger.info(str(e.args))
            return JsonResponse({'error': str(e.args)})
        

def _get_error_message(errors, str_order):
    _fields = {
        'pair': '通貨',
        'market': '取引所',
        'start_amount': '注文数量',
        'price': '指値金額',
        'price_for_stop': '逆指値金額',
        'trail_width': 'トレール幅',
        'rate': '通知レート',
        'non_field_errors': ''
    }
    error_key = list(errors.keys())[0]
    error_val = errors[error_key][0]
    return str_order + ' ' + _fields[error_key] + ': ' + error_val

def ajax_orders(request):
    logger = logging.getLogger('api')

    if request.user.is_anonymous or request.user.is_active == False:
        return JsonResponse({'error' : 'authentication failed'}, status=401)

    user = request.user
    method = request.method
    if method == 'GET': 
        if request.GET.get('type') == 'active':
            try:
                offset = int(request.GET.get('offset'))
                to = int(request.GET.get('limit')) + offset
                search_market = request.GET.get('market')
                search_pair = request.GET.get('pair')

                active_orders = Relation.objects.filter(user = user).filter(is_active = True)

                if search_market != "all":
                    active_orders = active_orders.filter(market=search_market)
                if search_pair != "all":
                    active_orders = active_orders.filter(pair=search_pair)

                data = {
                    'total_count': active_orders.count(),
                    'data': RelationSerializer(active_orders.order_by('-pk')[offset:to], many=True ).data
                }
                return JsonResponse(data)
            except Exception as e:
                logger.error('get active orders: ' + str(e.args))
                return JsonResponse({'error': str(e.args)})
           
        elif request.GET.get('type') == 'history':
            try:
                offset = int(request.GET.get('offset'))
                to = int(request.GET.get('limit')) + offset
                search_market = request.GET.get('market')
                search_pair = request.GET.get('pair')

                order_history = Order.objects.filter(user=user).filter(status__in=[Order.STATUS_CANCELED_PARTIALLY_FILLED, Order.STATUS_FULLY_FILLED, Order.STATUS_FAILED_TO_ORDER])
                
                if search_market != 'all':
                    order_history = order_history.filter(market = search_market)
                if search_pair != 'all':
                    order_history = order_history.filter(pair = search_pair)
                
                data = {
                    'total_count': order_history.count(),
                    'data': OrderSerializer(order_history.order_by('-pk')[offset:to], many=True).data
                }
                return JsonResponse(data)
            except Exception as e:
                return JsonResponse({'error': e.args})

    elif method == 'POST':
        op = request.POST.get('method')
        if op == 'POST':

            market = request.POST.get('market')
            pair = request.POST.get('pair')
            special_order = request.POST.get('special_order')

            relation = Relation()
            relation.user = user
            relation.market = market
            relation.pair = pair
            relation.special_order = special_order
            if special_order == 'SINGLE':
                try:
                    dic_o1 = json.loads(request.POST.get('order_1'))
                    dic_o1['status'] = Order.STATUS_READY_TO_ORDER
                    o_1_serializer = OrderSerializer(data = dic_o1, context = {'user': user})
                    
                    if o_1_serializer.is_valid():
                        o_1 = o_1_serializer.save()
                    else:
                        return JsonResponse({'error': _get_error_message(o_1_serializer.errors, '新規注文')})
                    
                    if o_1.status == Order.STATUS_FAILED_TO_ORDER:
                        relation = None
                        return JsonResponse({'error': o_1.error_message})

                    relation.order_1 = o_1
                except Exception as e:
                    print(e.args)
                    logger.error('single order: ' + str(e.args))
                    return JsonResponse({'error': str(e.args)})

            elif special_order == 'IFD':
                try:
                    dic_o1 = json.loads(request.POST.get('order_1'))
                    dic_o1['status'] = Order.STATUS_READY_TO_ORDER
                    dic_o2 = json.loads(request.POST.get('order_2'))
                    dic_o2['status'] = Order.STATUS_WAIT_OTHER_ORDER_TO_FILL

                    o_1_serializer = OrderSerializer(data = dic_o1, context = {'user': user})
                    o_2_serializer = OrderSerializer(data = dic_o2, context = {'user': user})
                
                    if not o_1_serializer.is_valid():
                        return JsonResponse({'error': _get_error_message(o_1_serializer.errors, '新規注文')})

                    if not o_2_serializer.is_valid():
                        return JsonResponse({'error': _get_error_message(o_2_serializer.errors, '決済注文①')})


                    o_1 = o_1_serializer.save()
                    # 新規が失敗した場合
                    if o_1.status == Order.STATUS_FAILED_TO_ORDER:
                        relation = None
                        return JsonResponse({'error': o_1.error_message})
                    o_2 = o_2_serializer.save()
                    relation.order_1 = o_1
                    relation.order_2 = o_2
                except Exception as e:
                    logger.error('ifd order: ' + str(e.args))
                    return JsonResponse({'error': str(e.args)})

            elif special_order == 'OCO':
                try:
                    dic_o2 = json.loads(request.POST.get('order_2'))
                    dic_o2['status'] = Order.STATUS_READY_TO_ORDER
                    dic_o3 = json.loads(request.POST.get('order_3'))
                    dic_o3['status'] = Order.STATUS_READY_TO_ORDER

                    o_2_serializer = OrderSerializer(data = dic_o2, context = {'user': user})
                    o_3_serializer = OrderSerializer(data = dic_o3, context = {'user': user})
                    
                    if not o_2_serializer.is_valid():
                        return JsonResponse({'error': _get_error_message(o_2_serializer.errors, '決済注文①')})

                    if not o_3_serializer.is_valid():
                        return JsonResponse({'error': _get_error_message(o_3_serializer.errors, '決済注文②')})


                    o_2 = o_2_serializer.save()
                    o_3 = o_3_serializer.save()
                    
                    if o_2.status == Order.STATUS_FAILED_TO_ORDER:
                        o_3.cancel()
                        relation = None
                        return JsonResponse({'error': o_2.error_message})
                    if o_3.status == Order.STATUS_FAILED_TO_ORDER:
                        o_2.cancel()
                        relation = None
                        return JsonResponse({'error': o_3.error_message})

                    relation.order_2 = o_2
                    relation.order_3 = o_3

                except Exception as e:
                    logger.error('oco order: ' + str(e.args))
                    return JsonResponse({'error': str(e.args)})
                
            elif special_order == 'IFDOCO':
                try:
                    dic_o1 = json.loads(request.POST.get('order_1'))
                    dic_o1['status'] = Order.STATUS_READY_TO_ORDER
                    dic_o2 = json.loads(request.POST.get('order_2'))
                    dic_o2['status'] = Order.STATUS_WAIT_OTHER_ORDER_TO_FILL
                    dic_o3 = json.loads(request.POST.get('order_3'))
                    dic_o3['status'] = Order.STATUS_WAIT_OTHER_ORDER_TO_FILL

                    o_1_serializer = OrderSerializer(data = dic_o1, context = {'user': user})
                    o_2_serializer = OrderSerializer(data = dic_o2, context = {'user': user})
                    o_3_serializer = OrderSerializer(data = dic_o3, context = {'user': user})
                    
                    if not o_1_serializer.is_valid():
                        return JsonResponse({'error': _get_error_message(o_1_serializer.errors, '新規注文')})

                    if not o_2_serializer.is_valid():
                        return JsonResponse({'error': _get_error_message(o_2_serializer.errors, '決済注文①')})
                    if not o_3_serializer.is_valid():
                        return JsonResponse({'error': _get_error_message(o_3_serializer.errors, '決済注文②')})

                    o_1 = o_1_serializer.save()
                    if o_1.status == Order.STATUS_FAILED_TO_ORDER:
                        relation = None
                        return JsonResponse({'error': o_1.error_message})
                    
                    o_2 = o_2_serializer.save()
                    o_3 = o_3_serializer.save()

                    relation.order_1 = o_1
                    relation.order_2 = o_2
                    relation.order_3 = o_3
                except Exception as e:
                    logger.error('ifdoco order: ' + str(e.args))
                    return JsonResponse({'error': str(e.args)})
                    
            relation.is_active = True
            relation.save()

            return JsonResponse({'success': True})
            
        elif op == 'DELETE':
            try:
                pk = request.POST.get("pk")
                cancel_succeeded = True
                order = Order.objects.filter(pk = pk).get()
                if order.order_id != None:
                    cancel_succeeded = order.cancel()
                else:
                    # 未発注の場合はステータスをキャンセル済みに変更
                    order.status = 'CANCELED_UNFILLED'
                    order.save()
                if cancel_succeeded:
                    if Relation.objects.filter(order_1 = order).count() > 0:
                        relation = Relation.objects.get(order_1 = order)
                        relation.is_active = False

                    elif Relation.objects.filter(order_2 = order).count() > 0:
                        relation = Relation.objects.get(order_2 = order)
                        # IFD
                        if relation.order_3 == None:
                            relation.order_2 = None
                            relation.special_order = 'SINGLE'
                        # OCO
                        elif relation.order_1 == None:
                            relation.order_1 = relation.order_3
                            relation.order_2 = None
                            relation.order_3 = None
                            relation.special_order = 'SINGLE'
                        # IFDOCO
                        else:
                            relation.order_2 = relation.order_3
                            relation.order_3 = None
                            relation.special_order = 'IFD'

                    elif Relation.objects.filter(order_3 = order).count() > 0:
                        relation = Relation.objects.get(order_3 = order)
                        # OCO
                        if relation.order_1 == None:
                            relation.order_1 = relation.order_2
                            relation.order_2 = None
                            relation.order_3 = None
                            relation.special_order = 'SINGLE'
                        # IFDOCO
                        else:
                            relation.order_3 = None
                            relation.special_order = 'IFD'
                    relation.save()
                    return JsonResponse({'success': True})
                else:
                    return JsonResponse({'error': 'この注文はキャンセルできません'})
            except Exception as e:
                logger.error('cancel order: ' + str(e.args))
                return JsonResponse({'error': str(e.args)})

def ajax_attachment(request):
    logger = logging.getLogger('api')

    if request.user.is_anonymous or request.user.is_active == False:
        return JsonResponse({'error' : 'authentication failed'}, status=401)

    method = request.method

    if method == 'POST':
        try:
            if request.POST.get('method') == 'DELETE':
                pk = request.POST.get('pk')
                Attachment.objects.filter(pk=pk).delete()
                return JsonResponse({'success': True})
            else:
                a = Attachment()
                a.file = request.FILES['attachment']
                a.save()
                return JsonResponse({'success': True, 'pk': a.pk, 'url': a.file.url})
        except Exception as e:
            logger.error('post attchment: ' + str(e.args))
            return JsonResponse({'error': str(e.args)})
       
def ajax_inquiry(request):
    logger = logging.getLogger('api')

    if request.user.is_anonymous or request.user.is_active == False:
        return JsonResponse({'error' : 'authentication failed'}, status=401)
        
    if request.method == 'POST':       
        try:
            new_inquiry = Inquiry()
            new_inquiry.user = request.user
            new_inquiry.subject = request.POST.get('subject')
            new_inquiry.body = request.POST.get('body')
            new_inquiry.email_for_reply = request.POST.get('email_for_reply')
            att_1_pk = request.POST.get('att_pk_1')
            att_2_pk = request.POST.get('att_pk_2')
            att_3_pk = request.POST.get('att_pk_3')
            
            if att_1_pk != None and att_1_pk != '':
                new_inquiry.attachment_1 = Attachment.objects.get(pk = att_1_pk)
            if att_2_pk != None and att_2_pk != '':
                new_inquiry.attachment_2 = Attachment.objects.get(pk = att_2_pk)
            if att_3_pk != None and att_3_pk != '':
                new_inquiry.attachment_3 = Attachment.objects.get(pk = att_3_pk)
            
            new_inquiry.save()
        
            context = {
                'new_inquiry': new_inquiry,
            }

            subject_template_for_admin = get_template('bitbank/mail_template/inquiry/subject.txt')
            subject_for_admin = subject_template_for_admin.render(context)
            message_template_for_admin = get_template('bitbank/mail_template/inquiry/message.txt')
            message_for_admin = message_template_for_admin.render(context)

            subject_template_for_customer = get_template('bitbank/mail_template/inquiry/subject_for_customer.txt')
            subject_for_customer = subject_template_for_customer.render(context)
            message_template_for_customer = get_template('bitbank/mail_template/inquiry/message_for_customer.txt')
            message_for_customer = message_template_for_customer.render(context)

            kwargs_for_admin = dict(
                to = [settings.DEFAULT_FROM_EMAIL],
                from_email = settings.DEFAULT_FROM_EMAIL,
                subject = subject_for_admin,
                body = message_for_admin,
            )
            kwargs_for_customer = dict(
                to = [request.POST.get('email_for_reply')],
                from_email = settings.DEFAULT_FROM_EMAIL,
                subject = subject_for_customer,
                body = message_for_customer,
            )
            msg_for_admin = EmailMultiAlternatives(**kwargs_for_admin)
            msg_for_customer = EmailMultiAlternatives(**kwargs_for_customer)
            
            if (new_inquiry.attachment_1 != None):
                msg_for_admin.attach_file(new_inquiry.attachment_1.file.path)
                msg_for_customer.attach_file(new_inquiry.attachment_1.file.path)
                
            if (new_inquiry.attachment_2 != None):
                msg_for_admin.attach_file(new_inquiry.attachment_2.file.path)
                msg_for_customer.attach_file(new_inquiry.attachment_2.file.path)
                
            if (new_inquiry.attachment_3 != None):
                msg_for_admin.attach_file(new_inquiry.attachment_3.file.path)
                msg_for_customer.attach_file(new_inquiry.attachment_3.file.path)

            msg_for_admin.send()
            msg_for_customer.send()
            return JsonResponse({'success': '問い合わせが完了しました'})
        except Exception as e:
            logger.error('post inquiry: ' + str(e.args))
            return JsonResponse({'error': str(e.args)})
