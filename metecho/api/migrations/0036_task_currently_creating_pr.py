# Generated by Django 2.2.6 on 2019-11-06 21:02

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [("api", "0035_task_has_unmerged_commits")]

    operations = [
        migrations.AddField(
            model_name="task",
            name="currently_creating_pr",
            field=models.BooleanField(default=False),
        )
    ]
