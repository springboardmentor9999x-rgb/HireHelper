from django.db import migrations, models


def normalize_user_roles(apps, schema_editor):
    User = apps.get_model('accounts', 'User')

    User.objects.filter(role__in=['employer', 'EMPLOYER', 'HIRER']).update(role='hirer')
    User.objects.filter(role__in=['HELPER']).update(role='helper')


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0001_initial'),
    ]

    operations = [
        migrations.RunPython(normalize_user_roles, migrations.RunPython.noop),
        migrations.AlterField(
            model_name='user',
            name='role',
            field=models.CharField(choices=[('helper', 'Helper'), ('hirer', 'Hirer')], max_length=10),
        ),
    ]
