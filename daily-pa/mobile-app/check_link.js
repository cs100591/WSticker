
import * as Linking from 'expo-linking';

console.log('Scheme:', Linking.createURL(''));
console.log('Redirect URL:', Linking.createURL('/google-auth'));
