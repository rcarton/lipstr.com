from django.db import models

from oauth2client.django_orm import FlowField
from oauth2client.django_orm import CredentialsField

# The Flow could also be stored in memcache since it is short lived.


class FlowModel(models.Model):
    
    id = models.CharField(max_length=32, primary_key=True)
    flow = FlowField()

class CredentialsModel(models.Model):
    class MongoMeta:
        capped = True
        collection_size = 10*1024*1024
    
    id = models.CharField(max_length=32, primary_key=True)
    credential = CredentialsField()


