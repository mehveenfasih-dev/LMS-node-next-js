CREATE TABLE [Notifications] (
  [notificationID] UNIQUEIDENTIFIER NOT NULL CONSTRAINT [DF_Notifications_notificationID] DEFAULT NEWID(),
  [userID] INT NOT NULL,
  [dedupeKey] NVARCHAR(255) NOT NULL,
  [event] NVARCHAR(50) NOT NULL,
  [title] NVARCHAR(150) NOT NULL,
  [message] NVARCHAR(500) NOT NULL,
  [requestID] BIGINT NULL,
  [createdAt] DATETIME2 NOT NULL CONSTRAINT [DF_Notifications_createdAt] DEFAULT SYSUTCDATETIME(),
  [readAt] DATETIME2 NULL,
  CONSTRAINT [PK_Notifications] PRIMARY KEY ([notificationID]),
  CONSTRAINT [fk_notification_user] FOREIGN KEY ([userID]) REFERENCES [Users]([userID]) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT [UQ_Notifications_user_dedupe] UNIQUE ([userID], [dedupeKey])
);

CREATE INDEX [idx_notifications_user_created] ON [Notifications]([userID], [createdAt]);
