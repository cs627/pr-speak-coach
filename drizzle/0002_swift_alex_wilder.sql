CREATE TABLE `scenarioUnlocks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`scenarioKey` varchar(96) NOT NULL,
	`unlockedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `scenarioUnlocks_id` PRIMARY KEY(`id`),
	CONSTRAINT `scenarioUnlocks_user_scenario_unique` UNIQUE(`userId`,`scenarioKey`)
);
--> statement-breakpoint
CREATE INDEX `scenarioUnlocks_user_idx` ON `scenarioUnlocks` (`userId`);