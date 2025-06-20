import { notion, NOTION_PAGE_ID, createDatabaseIfNotExists } from "./notion.js";

async function setupNotionDatabases() {
    console.log("Setting up Notion databases...");
    
    try {
        // Create Work Activities database
        const activitiesDb = await createDatabaseIfNotExists("Work Activities", {
            Title: { title: {} },
            Description: { rich_text: {} },
            Type: {
                select: {
                    options: [
                        { name: "Commit", color: "blue" },
                        { name: "Pull Request", color: "green" },
                        { name: "Issue", color: "orange" },
                        { name: "Meeting", color: "purple" },
                        { name: "Calendar Event", color: "pink" }
                    ]
                }
            },
            Source: {
                select: {
                    options: [
                        { name: "GitHub", color: "default" },
                        { name: "Google Calendar", color: "yellow" },
                        { name: "Slack", color: "red" }
                    ]
                }
            },
            Date: { date: {} },
            Completed: { checkbox: {} }
        });
        
        console.log("✓ Work Activities database created");

        // Create Daily Summaries database
        const summariesDb = await createDatabaseIfNotExists("Daily Summaries", {
            Title: { title: {} },
            Date: { date: {} },
            Summary: { rich_text: {} },
            TasksCompleted: { number: {} },
            Meetings: { number: {} },
            Blockers: { number: {} }
        });
        
        console.log("✓ Daily Summaries database created");
        console.log("Notion databases setup completed successfully!");
        
        return { activitiesDb, summariesDb };
    } catch (error) {
        console.error("Error setting up Notion databases:", error);
        throw error;
    }
}

// Only run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    setupNotionDatabases()
        .then(() => {
            console.log("Setup complete!");
            process.exit(0);
        })
        .catch(error => {
            console.error("Setup failed:", error);
            process.exit(1);
        });
}

export { setupNotionDatabases };