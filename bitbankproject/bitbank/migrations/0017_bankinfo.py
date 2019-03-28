# Generated by Django 2.1.5 on 2019-03-26 04:12

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('bitbank', '0016_auto_20190325_2134'),
    ]

    operations = [
        migrations.CreateModel(
            name='BankInfo',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('bank', models.CharField(default='xxx銀行', max_length=20, verbose_name='金融機関名')),
                ('branch', models.CharField(default='xxx支店', max_length=20, verbose_name='支店名')),
                ('type', models.CharField(choices=[('普通', '普通'), ('当座', '当座')], default='普通', max_length=20, verbose_name='口座種別')),
                ('number', models.CharField(default='00000', max_length=20, verbose_name='口座番号')),
            ],
            options={
                'verbose_name': '口座情報',
                'verbose_name_plural': '口座情報',
            },
        ),
    ]
