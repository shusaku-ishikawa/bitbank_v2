# Generated by Django 2.1.5 on 2019-03-28 06:02

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('bitbank', '0017_bankinfo'),
    ]

    operations = [
        migrations.AlterModelOptions(
            name='bankinfo',
            options={'verbose_name': '振込口座情報', 'verbose_name_plural': '振込口座情報'},
        ),
        migrations.RenameField(
            model_name='alert',
            old_name='threshold',
            new_name='rate',
        ),
    ]
