import { Redirect } from 'expo-router';

export default function Index() {
    // Redirect tới màn hình login khi vào app
    return <Redirect href="/login" />;
}
