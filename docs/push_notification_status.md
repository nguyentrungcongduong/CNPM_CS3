# Push Notification Integration
The integration of Expo Push Notifications with the Laravel backend is complete!

All the steps you requested have been successfully implemented:
- **[Mobile]** Installed `expo-notifications`.
- **[Mobile]** Requested notification permissions and setup iOS/Android configs.
- **[Mobile]** Fetching Expo Push Token and saving it via the `/api/push-token` endpoint.
- **[BE]** Laravel QUEUE is configured. Jobs (`SendOrderNotification`, `CheckLateDeliveries`) are actively dispatching async requests.
- **[BE]** The `NotificationService` dynamically maps users and sends targeted push alerts for new orders, approvals, and deliveries directly to Expo's Push API endpoint.
- **[BE]** The order controllers (Store, Coordinator, Kitchen) trigger notifications smoothly on state changes.

Please run `php artisan queue:work` locally to start processing the queued push notification jobs!
