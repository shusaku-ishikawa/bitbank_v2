# Generated by Django 2.1.5 on 2019-03-24 11:12

import django.core.validators
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('bitbank', '0014_auto_20190324_0950'),
    ]

    operations = [
        migrations.AlterField(
            model_name='alert',
            name='threshold',
            field=models.FloatField(validators=[django.core.validators.MinValueValidator(0)], verbose_name='通知レート'),
        ),
        migrations.AlterField(
            model_name='order',
            name='average_price',
            field=models.FloatField(blank=True, null=True, validators=[django.core.validators.MinValueValidator(0.0)], verbose_name='約定平均価格'),
        ),
        migrations.AlterField(
            model_name='order',
            name='market',
            field=models.CharField(max_length=50, verbose_name='取引所'),
        ),
        migrations.AlterField(
            model_name='order',
            name='trail_price',
            field=models.FloatField(blank=True, null=True, validators=[django.core.validators.MinValueValidator(0.0)], verbose_name='トレール金額'),
        ),
        migrations.AlterField(
            model_name='user',
            name='email_for_notice',
            field=models.EmailField(default='sample@example.com', max_length=254, verbose_name='通知用メールアドレス'),
        ),
        migrations.AlterField(
            model_name='user',
            name='full_name',
            field=models.CharField(default='no name', max_length=150, verbose_name='名前'),
        ),
    ]
