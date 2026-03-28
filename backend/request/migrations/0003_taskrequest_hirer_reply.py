from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('request', '0002_request_week5_updates'),
    ]

    operations = [
        migrations.AddField(
            model_name='taskrequest',
            name='hirer_reply',
            field=models.TextField(blank=True),
        ),
    ]
