from django import forms


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
    