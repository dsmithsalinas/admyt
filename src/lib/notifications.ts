import { supabase } from "./supabase";

export interface NotificationPreferences {
  deadlineRemindersEnabled: boolean;
  timezone: string;
}

export function browserTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}

export async function getNotificationPreferences(
  userId: string,
): Promise<NotificationPreferences> {
  const { data, error } = await supabase
    .from("notification_preferences")
    .select("deadline_reminders_enabled,timezone")
    .eq("user_id", userId)
    .maybeSingle();

  if (error)
    throw new Error(
      `notification_preferences_read_failed:${error.code ?? "unknown"}`,
    );
  return {
    deadlineRemindersEnabled: data?.deadline_reminders_enabled ?? false,
    timezone: data?.timezone ?? browserTimezone(),
  };
}

export async function saveDeadlineReminderPreference(
  userId: string,
  enabled: boolean,
): Promise<void> {
  const { error } = await supabase.from("notification_preferences").upsert(
    {
      user_id: userId,
      deadline_reminders_enabled: enabled,
      timezone: browserTimezone(),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );

  if (error)
    throw new Error(
      `notification_preferences_save_failed:${error.code ?? "unknown"}`,
    );
}
