export interface SlackAuthedUser {
  id: string;
  scope: string;
  access_token: string;
  token_type: string;
}

export interface SlackTeam {
  id: string;
  name: string;
}

export interface SlackResponseMetadata {
  scopes: string[];
}

export interface SlackUserProfile {
  title: string;
  phone: string;
  skype: string;
  real_name: string;
  real_name_normalized: string;
  display_name: string;
  display_name_normalized: string;
  fields: any;
  status_text: string;
  status_emoji: string;
  status_emoji_display_info: any[];
  status_expiration: number;
  avatar_hash: string;
  first_name: string;
  last_name: string;
  image_24: string;
  image_32: string;
  image_48: string;
  image_72: string;
  image_192: string;
  image_512: string;
  status_text_canonical: string;
  team: SlackTeam | string;
}

export interface SlackUser {
  id: string;
  team_id: string;
  name: string;
  deleted: boolean;
  color: string;
  real_name: string;
  tz: string;
  tz_label: string;
  tz_offset: number;
  profile: SlackUserProfile;
  is_admin: boolean;
  is_owner: boolean;
  is_primary_owner: boolean;
  is_restricted: boolean;
  is_ultra_restricted: boolean;
  is_bot: boolean;
  is_app_user: boolean;
  updated: number;
  is_email_confirmed: boolean;
  who_can_share_contact_card: string;
}

export interface SlackOAuthResponse {
  ok: boolean;
  app_id: string;
  authed_user: SlackAuthedUser;
  scope: string;
  token_type: string;
  access_token: string;
  bot_user_id: string;
  team: SlackTeam;
  enterprise: any;
  is_enterprise_install: boolean;
  response_metadata: SlackResponseMetadata;
}
