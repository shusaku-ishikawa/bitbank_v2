# Generated by Django 2.1.5 on 2019-03-20 04:11

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('bitbank', '0003_auto_20190320_1305'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='bitbankorder',
            name='market',
        ),
        migrations.AddField(
            model_name='orderrelation',
            name='market',
            field=models.CharField(default='bitbank', max_length=50, verbose_name='取引所'),
        ),
    ]
