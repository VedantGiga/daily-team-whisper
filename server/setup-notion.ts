import { Client } from "@notionhq/client";
import { notion, NOTION_PAGE_ID, createDatabaseIfNotExists, findDatabaseByTitle } from "./notion";

// Environment variables validation
if (!process.env.NOTION_INTEGRATION_SECRET) {
    throw new Error("NOTION_INTEGRATION_SECRET is not defined. Please add it to your environment variables.");
}

// Setup databases for the AutoBrief application
async function setupNotionDatabases() {
    console.log("Setting up Notion databases...");
    
    // Create Work Activities database
    await createDatabaseIfNotExists("Work Activities", {
        // Every database needs a Name/Title property
        Title: {
            title: {}
        },
        Description: {
            rich_text: {}
        },
        Type: {
            select: {
                options: [
                    { name: "commit", color: "blue" },
                    { name: "pull_request", color: "green" },
                    { name: "issue", color: "red" },
                    { name: "meeting", color: "purple" },
                    { name: "calendar_event", color: "orange" },
                    { name: "task", color: "yellow" },
                    { name: "other", color: "gray" }
                ]
            }
        },
        Source: {
            select: {
                options: [
                    { name: "github", color: "blue" },
                    { name: "google_calendar", color: "green" },
                    { name: "slack", color: "purple" },
                    { name: "manual", color: "gray" }
                ]
            }
        },
        Timestamp: {
            date: {}
        },
        Metadata: {
            rich_text: {}
        }
    });

    // Create Daily Summaries database
    await createDatabaseIfNotExists("Daily Summaries", {
        Title: {
            title: {}
        },
        Date: {
            date: {}
        },
        TasksCompleted: {
            number: {}
        },
        Blockers: {
            number: {}
        },
        Meetings: {
            number: {}
        },
        Summary: {
            rich_text: {}
        },
        GeneratedAt: {
            date: {}
        }
    });

    console.log("Notion databases setup complete!");
}

async function createSampleData() {
    try {
        console.log("Adding sample data...");

        // Find the databases
        const activitiesDb = await findDatabaseByTitle("Work Activities");
        const summariesDb = await findDatabaseByTitle("Daily Summaries");

        if (!activitiesDb || !summariesDb) {
            throw new Error("Could not find the required databases.");
        }

        // Sample work activities
        const activities = [
            {
                title: "Fixed authentication bug",
                description: "Resolved issue with user login persistence across page refreshes",
                type: "commit",
                source: "github"
            },
            {
                title: "Team standup meeting",
                description: "Daily team sync - discussed sprint progress and blockers",
                type: "meeting",
                source: "google_calendar"
            },
            {
                title: "Code review for PR #123",
                description: "Reviewed pull request for new dashboard feature implementation",
                type: "pull_request",
                source: "github"
            },
            {
                title: "Client feedback session",
                description: "Gathered requirements for upcoming feature releases",
                type: "meeting",
                source: "manual"
            }
        ];

        for (let activity of activities) {
            await notion.pages.create({
                parent: {
                    database_id: activitiesDb.id
                },
                properties: {
                    Title: {
                        title: [
                            {
                                text: {
                                    content: activity.title
                                }
                            }
                        ]
                    },
                    Description: {
                        rich_text: [
                            {
                                text: {
                                    content: activity.description
                                }
                            }
                        ]
                    },
                    Type: {
                        select: {
                            name: activity.type
                        }
                    },
                    Source: {
                        select: {
                            name: activity.source
                        }
                    },
                    Timestamp: {
                        date: {
                            start: new Date().toISOString()
                        }
                    }
                }
            });
        }

        // Sample daily summary
        await notion.pages.create({
            parent: {
                database_id: summariesDb.id
            },
            properties: {
                Title: {
                    title: [
                        {
                            text: {
                                content: `Daily Summary - ${new Date().toLocaleDateString()}`
                            }
                        }
                    ]
                },
                Date: {
                    date: {
                        start: new Date().toISOString().split('T')[0]
                    }
                },
                TasksCompleted: {
                    number: 4
                },
                Blockers: {
                    number: 0
                },
                Meetings: {
                    number: 2
                },
                Summary: {
                    rich_text: [
                        {
                            text: {
                                content: "Productive day with successful bug fixes and client meetings. Team collaboration was strong with effective code reviews. No major blockers encountered."
                            }
                        }
                    ]
                },
                GeneratedAt: {
                    date: {
                        start: new Date().toISOString()
                    }
                }
            }
        });

        console.log("Sample data creation complete.");
    } catch (error) {
        console.error("Error creating sample data:", error);
    }
}

// Run the setup
setupNotionDatabases().then(() => {
    return createSampleData();
}).then(() => {
    console.log("Setup complete!");
    process.exit(0);
}).catch(error => {
    console.error("Setup failed:", error);
    process.exit(1);
});