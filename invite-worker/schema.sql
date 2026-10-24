-- 「去广告」邀请码:一次性 wrangler d1 execute aipodcast-stats --remote --file=invite-worker/schema.sql
CREATE TABLE IF NOT EXISTS inv_codes(
  code       TEXT PRIMARY KEY,          -- 6 位邀请码
  issuer     TEXT NOT NULL,             -- 'root'(Jason) 或签发它的成员 mid
  created_at INTEGER NOT NULL,
  used_by    TEXT,                      -- 兑换它的成员 mid;NULL=未用
  used_at    INTEGER
);
CREATE INDEX IF NOT EXISTS inv_codes_issuer ON inv_codes(issuer);
CREATE TABLE IF NOT EXISTS inv_members(
  mid        TEXT PRIMARY KEY,          -- 16 hex 随机
  token      TEXT NOT NULL UNIQUE,      -- 32 hex 随机;浏览器持有的身份凭证
  via_code   TEXT,                      -- 用哪个码进来的
  invited_by TEXT,                      -- 'root' 或上级成员 mid(邀请树的边)
  created_at INTEGER NOT NULL,
  label      TEXT                       -- 发起人可选备注(不存个人信息)
);
CREATE INDEX IF NOT EXISTS inv_members_inviter ON inv_members(invited_by);
