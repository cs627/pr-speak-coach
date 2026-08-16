CREATE TABLE `dailySessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`sessionDate` date NOT NULL,
	`status` enum('not_started','in_progress','completed') NOT NULL DEFAULT 'not_started',
	`completedStages` int NOT NULL DEFAULT 0,
	`xpEarned` int NOT NULL DEFAULT 0,
	`overallScore` int,
	`completedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `dailySessions_id` PRIMARY KEY(`id`),
	CONSTRAINT `dailySessions_user_date_unique` UNIQUE(`userId`,`sessionDate`)
);
--> statement-breakpoint
CREATE TABLE `learnerProfiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`currentLevel` enum('beginner','professional','expert') NOT NULL DEFAULT 'beginner',
	`xp` int NOT NULL DEFAULT 0,
	`streak` int NOT NULL DEFAULT 0,
	`longestStreak` int NOT NULL DEFAULT 0,
	`preferredVoice` varchar(64) DEFAULT 'en-US',
	`lastCompletedDate` date,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `learnerProfiles_id` PRIMARY KEY(`id`),
	CONSTRAINT `learnerProfiles_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `sentenceAttempts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`dailySessionId` int NOT NULL,
	`sentenceKey` varchar(96) NOT NULL,
	`transcript` text,
	`accuracy` int NOT NULL,
	`fluency` int NOT NULL,
	`prosody` int NOT NULL,
	`completeness` int NOT NULL,
	`overallScore` int NOT NULL,
	`passed` boolean NOT NULL DEFAULT false,
	`feedbackJson` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `sentenceAttempts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `smallTalkResponses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`dailySessionId` int NOT NULL,
	`scenarioKey` varchar(96) NOT NULL,
	`responseText` text NOT NULL,
	`relevance` int NOT NULL,
	`naturalness` int NOT NULL,
	`connection` int NOT NULL,
	`overallScore` int NOT NULL,
	`feedback` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `smallTalkResponses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `dailySessions_user_date_idx` ON `dailySessions` (`userId`,`sessionDate`);--> statement-breakpoint
CREATE INDEX `sentenceAttempts_session_idx` ON `sentenceAttempts` (`dailySessionId`);--> statement-breakpoint
CREATE INDEX `smallTalkResponses_session_idx` ON `smallTalkResponses` (`dailySessionId`);