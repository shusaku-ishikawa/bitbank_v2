# Generated by Django 2.1.5 on 2019-05-05 03:18

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('bitbank', '0021_auto_20190413_1100'),
    ]

    operations = [
        migrations.AddField(
            model_name='bankinfo',
            name='meigi',
            field=models.CharField(default='xxxxx', max_length=50, verbose_name='口座名義人'),
        ),
    ]
