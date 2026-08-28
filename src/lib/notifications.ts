import { supabase } from "./supabase";

export interface NotificationPreferences {
  deadlineRemindersEnabled: boolean;
  planRemindersEnabled: boolean;
  gettingStartedEnabled: boolean;
  weeklyDigestEnabled: boolean;
  timezone: string;
}

export type NotificationPreferenceKey =
  | "deadlineRemindersEnabled"
  | "planRemindersEnabled"
  | "gettingStartedEnabled"
  | "weeklyDigestEnabled";

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
    .select("deadline_reminders_enabled,plan_reminders_enabled,getting_started_enabled,weekly_digest_enabled,timezone")
    .eq("user_id", userId)
    .maybeSingle();

  if (error)
    throw new Error(
      `notification_preferences_read_failed:${error.code ?? "unknown"}`,
    );
  return {
    deadlineRemindersEnabled: data?.deadline_reminders_enabled ?? false,
    planRemindersEnabled: data?.plan_reminders_enabled ?? false,
    gettingStartedEnabled: data?.getting_started_enabled ?? false,
    weeklyDigestEnabled: data?.weekly_digest_enabled ?? false,
    timezone: data?.timezone ?? browserTimezone(),
  };
}

const preferenceColumns: Record<NotificationPreferenceKey, string> = {
  deadlineRemindersEnabled: "deadline_reminders_enabled",
  planRemindersEnabled: "plan_reminders_enabled",
  gettingStartedEnabled: "getting_started_enabled",
  weeklyDigestEnabled: "weekly_digest_enabled",
};

const optedInAtColumns: Partial<Record<NotificationPreferenceKey, string>> = {
  planRemindersEnabled: "plan_reminders_opted_in_at",
  gettingStartedEnabled: "getting_started_opted_in_at",
  weeklyDigestEnabled: "weekly_digest_opted_in_at",
};

export async function saveNotificationPreference(
  userId: string,
  preference: NotificationPreferenceKey,
  enabled: boolean,
): Promise<void> {
  const optedInAtColumn = optedInAtColumns[preference];
  const { error } = await supabase.from("notification_preferences").upsert(
    {
      user_id: userId,
      [preferenceColumns[preference]]: enabled,
      ...(optedInAtColumn ? { [optedInAtColumn]: enabled ? new Date().toISOString() : null } : {}),
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
