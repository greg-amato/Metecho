# Generated by Django 2.2.6 on 2019-10-31 22:09

import sfdo_template_helpers.fields.string
from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [("api", "0032_merge_20191024_2231")]

    operations = [
        migrations.AddField(
            model_name="scratchorg",
            name="owner_sf_id",
            field=sfdo_template_helpers.fields.string.StringField(blank=True),
        )
    ]