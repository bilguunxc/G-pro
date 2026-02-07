import { useNotification } from "../context/NotificationContext";
import Toast from "./Toast";

export default function NotificationContainer() {
  const { notifications } = useNotification();

  return (
    <div className="fixed z-50 flex flex-col top-4 right-4">
      {notifications.map((n) => (
        <Toast key={n.id} message={n.message} type={n.type} />
      ))}
    </div>
  );
}
