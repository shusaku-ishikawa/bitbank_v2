"""
Django settings for bitbankproject project.

Generated by 'django-admin startproject' using Django 2.1.5.

For more information on this file, see
https://docs.djangoproject.com/en/2.1/topics/settings/

For the full list of settings and their values, see
https://docs.djangoproject.com/en/2.1/ref/settings/
"""

import os, logging

# Build paths inside the project like this: os.path.join(BASE_DIR, ...)
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


# Quick-start development settings - unsuitable for production
# See https://docs.djangoproject.com/en/2.1/howto/deployment/checklist/

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = 'k9yiss_wm7w!bj*h6u7pt77*&emv0ek)=ey4_xw3ht4e8byn2a'

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = True

ALLOWED_HOSTS = ['*']

SESSION_COOKIE_AGE = 60 * 30

# Application definition

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'django_crontab',
    'bitbank',
    'rest_framework',
]


AUTH_USER_MODEL = 'bitbank.User'
LOGIN_URL = 'bitbank:login'
LOGIN_REDIRECT_URL = 'bitbank:order'
LOGOUT_REDIRECT_URL = 'bitbank:login'

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'bitbankproject.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [os.path.join(BASE_DIR, 'templates')],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'bitbankproject.wsgi.application'


# Database
# https://docs.djangoproject.com/en/2.1/ref/settings/#databases

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.mysql',
        'NAME': 'bitbank_dev',
        'USER': 'root',
        'PASSWORD': '332191-Aa',
        'HOST': '127.0.0.1',
        'PORT': '',
        'OPTIONS': {
            'init_command': "SET sql_mode='STRICT_TRANS_TABLES'",
        },
    }
}

# Logging
ADMINS = [('shusaku ishikawa', 'ishikawasyuusaku@gmail.com')]


LOGGING = {
    'version': 1,   # これを設定しないと怒られる
    'disable_existing_loggers': False,
    'formatters': { # 出力フォーマットを文字列形式で指定する
        'all': {    # 出力フォーマットに`all`という名前をつける
            'format': '\t'.join([
                "[%(levelname)s]",
                "asctime:%(asctime)s",
                "module:%(module)s",
                "message:%(message)s",
            ])
        },
    },
    'filters': {
        'require_debug_false': {
            '()': 'django.utils.log.RequireDebugFalse',
        },
        'require_debug_true': {
            '()': 'django.utils.log.RequireDebugTrue',
        },
    },
    'handlers': {  # ログをどこに出すかの設定
        'console': {
            'level': 'INFO',
            'filters': ['require_debug_true'],
            'class': 'logging.StreamHandler',
        },
        'file_transaction': { 
            'level': 'DEBUG',  # DEBUG以上のログを取り扱うという意味
            'class': 'logging.handlers.RotatingFileHandler',
            'filename': os.path.join(BASE_DIR, 'logs/transaction.log'),
            'formatter': 'all',
            'maxBytes': 1024 * 1024,
            'backupCount': 10,
        },
        'file_monitor_order_status': { 
            'level': 'DEBUG',  # DEBUG以上のログを取り扱うという意味
            'class': 'logging.handlers.RotatingFileHandler',
            'filename': os.path.join(BASE_DIR, 'logs/monitor_order_status.log'),
            'formatter': 'all',
            'maxBytes': 100024 * 1024,
            'backupCount': 1,
        },
        'file_monitor_ticker': { 
            'level': 'DEBUG',  # DEBUG以上のログを取り扱うという意味
            'class': 'logging.handlers.RotatingFileHandler',
            'filename': os.path.join(BASE_DIR, 'logs/monitor_ticker.log'),
            'formatter': 'all',
            'maxBytes': 100024 * 1024,
            'backupCount': 1,
        },
        'file_sync_orders': { 
            'level': 'DEBUG',  # DEBUG以上のログを取り扱うという意味
            'class': 'logging.handlers.RotatingFileHandler',
            'filename': os.path.join(BASE_DIR, 'logs/sync_orders.log'),
            'formatter': 'all',
            'maxBytes': 100024 * 1024,
            'backupCount': 1,
        },
    },
    'loggers': {  # どんなloggerがあるかを設定する
        'transaction_logger': { 
            'handlers': ['file_transaction', 'console'],  # 先述のfile, consoleの設定で出力
            'level': 'DEBUG',
        },
        'monitor_order_status': { 
            'handlers': ['file_monitor_order_status', 'console'],  # 先述のfile, consoleの設定で出力
            'level': 'DEBUG',
        },
        'monitor_ticker': { 
            'handlers': ['file_monitor_ticker', 'console'],  # 先述のfile, consoleの設定で出力
            'level': 'DEBUG',
        },
        'sync_orders': { 
            'handlers': ['file_sync_orders', 'console'],  # 先述のfile, consoleの設定で出力
            'level': 'DEBUG',
        },
    },
}

# Password validation
# https://docs.djangoproject.com/en/2.1/ref/settings/#auth-password-validators

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]

DEFAULT_FILE_STORAGE = 'bitbank.models.ASCIIFileSystemStorage'

# Internationalization
# https://docs.djangoproject.com/en/2.1/topics/i18n/

LANGUAGE_CODE = 'ja'

TIME_ZONE = 'Asia/Tokyo'

USE_I18N = True

USE_L10N = True

USE_TZ = True


# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/2.1/howto/static-files/

STATIC_ROOT = os.path.join(BASE_DIR, 'static/')
STATIC_URL = '/static_dev/'
STATICFILES_DIRS = [
    os.path.join(BASE_DIR, 'bitbank/static'),
]
MEDIA_ROOT = os.path.join(BASE_DIR,'uploaded_files')
MEDIA_URL = '/attachments/'

#EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'

# DEFAULT_FROM_EMAIL = 'ishikawasyuusaku@gmail.com'
# DEFAULT_CHARSET = 'utf-8'
# EMAIL_HOST = 'smtp.gmail.com'
# EMAIL_PORT = 587
# EMAIL_HOST_USER = 'ishikawasyuusaku@gmail.com'
# EMAIL_HOST_PASSWORD = '332191-Aa2'
# EMAIL_USE_TLS = True

DEFAULT_FROM_EMAIL = 'kenkenpar55@kenkenpar.com'
DEFAULT_CHARSET = 'utf-8'
EMAIL_HOST = 'smtp.muumuu-mail.com'
EMAIL_PORT = 587
EMAIL_HOST_USER = 'kenkenpar55@kenkenpar.com'
EMAIL_HOST_PASSWORD = '1q1q1q1q'
EMAIL_USE_TLS = False

BANK = '三井住友'
BRANCH = '立川'
TYPE = '普通'
NUMBER = '22222'

# JOBs
CRONJOBS = [
    ('* * * * *', 'django.core.management.call_command', ['monitor_order_status']),
    ('* * * * *', 'django.core.management.call_command', ['monitor_ticker']),
    ('* 9 * * *', 'django.core.management.call_command', ['decrement_remaining_days']),
    ('* * 1 * *', 'django.core.management.call_command', ['gabage']),
]
CRONTAB_LOCK_JOBS = False
