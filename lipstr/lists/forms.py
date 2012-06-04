from django import forms
from django.contrib.auth import authenticate


class SignupForm(forms.Form):
    email = forms.EmailField(error_messages={
                                               'required': "An email address is required.",
                                               'invalid': "Invalid email address.",
                                            })
    password = forms.CharField(min_length=4, max_length=100,
                               error_messages={
                                               'required': "It's safer with a password.",
                                               'min_length': 'Password too short.',
                                               'max_length': 'Password too long (really?).',
                                               })
    firstname = forms.CharField(required=False)


class PreferencesForm(forms.Form):
    user = forms.CharField()
    displayname = forms.CharField()
    newpassword = forms.CharField(required=False, min_length=4, max_length=100,
                               error_messages={
                                               'required': "It's safer with a password.",
                                               'min_length': 'Password too short.',
                                               'max_length': 'Password too long (really?).',
                                               })
    oldpassword = forms.CharField(required=False)
    
    def clean(self):
        cleaned_data = super(PreferencesForm, self).clean()
        oldpassword = cleaned_data.get("oldpassword")
        newpassword = cleaned_data.get("newpassword")
        user = cleaned_data.get('user')
        
        if oldpassword:
            auth = authenticate(username=user, password=oldpassword)
            if not auth:
                self._errors['oldpassword'] = self.error_class([u'Invalid password.'])
                del cleaned_data['oldpassword']
            
            if not newpassword:
                self._errors['newpassword'] = self.error_class([u'The new password cannot be empty'])
                del cleaned_data['newpassword']

        return cleaned_data