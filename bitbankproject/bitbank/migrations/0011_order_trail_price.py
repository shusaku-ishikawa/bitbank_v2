# Generated by Django 2.1.5 on 2019-03-21 13:11

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('bitbank', '0010_order_trail_width'),
    ]

    operations = [
        migrations.AddField(
            model_name='order',
            name='trail_price',
            field=models.FloatField(blank=True, null=True, verbose_name='トレール金額'),
        ),
    ]
