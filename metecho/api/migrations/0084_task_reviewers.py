# Generated by Django 3.0.8 on 2020-07-15 19:57

import django.contrib.postgres.fields.jsonb
from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("api", "0083_remove_all_null_strings"),
    ]

    operations = [
        migrations.AddField(
            model_name="task",
            name="reviewers",
            field=django.contrib.postgres.fields.jsonb.JSONField(
                blank=True, default=list
            ),
        ),
    ]
