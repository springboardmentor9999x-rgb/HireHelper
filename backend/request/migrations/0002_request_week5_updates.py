from django.db import migrations, models


def normalize_request_statuses(apps, schema_editor):
    TaskRequest = apps.get_model('request', 'TaskRequest')
    mapping = {
        'pending': 'PENDING',
        'accepted': 'ACCEPTED',
        'rejected': 'REJECTED',
        'completed': 'COMPLETED',
    }

    for old_status, new_status in mapping.items():
        TaskRequest.objects.filter(status=old_status).update(status=new_status)


class Migration(migrations.Migration):

    dependencies = [
        ('request', '0001_initial'),
    ]

    operations = [
        migrations.RunPython(normalize_request_statuses, migrations.RunPython.noop),
        migrations.AlterField(
            model_name='taskrequest',
            name='status',
            field=models.CharField(
                choices=[
                    ('PENDING', 'Pending'),
                    ('ACCEPTED', 'Accepted'),
                    ('REJECTED', 'Rejected'),
                    ('COMPLETED', 'Completed'),
                ],
                default='PENDING',
                max_length=20,
            ),
        ),
        migrations.AlterModelTable(
            name='taskrequest',
            table='requests',
        ),
        migrations.AddConstraint(
            model_name='taskrequest',
            constraint=models.UniqueConstraint(
                fields=('task', 'requester'),
                name='unique_task_request_per_requester',
            ),
        ),
    ]
