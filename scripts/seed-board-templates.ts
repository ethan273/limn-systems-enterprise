import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Sample templates with template_data including objects
const TEMPLATES = [
  {
    name: "Brainstorming Session",
    description: "Perfect for team brainstorming with sticky notes and sections",
    category: "brainstorming",
    is_featured: true,
    tags: ["brainstorming", "sticky-notes", "ideation"],
    template_data: {
      settings: {
        backgroundColor: "#ffffff",
        gridEnabled: true,
      },
      objects: [
        // Title
        {
          object_type: "i-text",
          object_data: {
            type: "i-text",
            text: "Brainstorming Session",
            fontSize: 32,
            fontWeight: "bold",
            fill: "#1e293b",
            left: 50,
            top: 30,
          },
          position_x: 50,
          position_y: 30,
          width: 400,
          height: 40,
        },
        // Section 1: Ideas
        {
          object_type: "rect",
          object_data: {
            type: "rect",
            width: 300,
            height: 400,
            fill: "#f0f9ff",
            stroke: "#3b82f6",
            strokeWidth: 2,
            rx: 8,
            ry: 8,
            left: 50,
            top: 100,
          },
          position_x: 50,
          position_y: 100,
          width: 300,
          height: 400,
        },
        {
          object_type: "i-text",
          object_data: {
            type: "i-text",
            text: "Ideas",
            fontSize: 20,
            fontWeight: "bold",
            fill: "#1e40af",
            left: 180,
            top: 120,
          },
          position_x: 180,
          position_y: 120,
          width: 100,
          height: 25,
        },
        // Section 2: Actions
        {
          object_type: "rect",
          object_data: {
            type: "rect",
            width: 300,
            height: 400,
            fill: "#f0fdf4",
            stroke: "#10b981",
            strokeWidth: 2,
            rx: 8,
            ry: 8,
            left: 400,
            top: 100,
          },
          position_x: 400,
          position_y: 100,
          width: 300,
          height: 400,
        },
        {
          object_type: "i-text",
          object_data: {
            type: "i-text",
            text: "Action Items",
            fontSize: 20,
            fontWeight: "bold",
            fill: "#047857",
            left: 510,
            top: 120,
          },
          position_x: 510,
          position_y: 120,
          width: 150,
          height: 25,
        },
        // Section 3: Questions
        {
          object_type: "rect",
          object_data: {
            type: "rect",
            width: 300,
            height: 400,
            fill: "#fef3c7",
            stroke: "#f59e0b",
            strokeWidth: 2,
            rx: 8,
            ry: 8,
            left: 750,
            top: 100,
          },
          position_x: 750,
          position_y: 100,
          width: 300,
          height: 400,
        },
        {
          object_type: "i-text",
          object_data: {
            type: "i-text",
            text: "Questions",
            fontSize: 20,
            fontWeight: "bold",
            fill: "#b45309",
            left: 860,
            top: 120,
          },
          position_x: 860,
          position_y: 120,
          width: 120,
          height: 25,
        },
      ],
    },
  },
  {
    name: "Strategic Planning",
    description: "Plan your strategy with goals, initiatives, and timelines",
    category: "strategic_planning",
    is_featured: true,
    tags: ["strategy", "planning", "goals"],
    template_data: {
      settings: {
        backgroundColor: "#ffffff",
        gridEnabled: true,
      },
      objects: [
        // Title
        {
          object_type: "i-text",
          object_data: {
            type: "i-text",
            text: "Strategic Planning",
            fontSize: 36,
            fontWeight: "bold",
            fill: "#1e293b",
            left: 50,
            top: 30,
          },
          position_x: 50,
          position_y: 30,
          width: 400,
          height: 45,
        },
        // Vision box
        {
          object_type: "rect",
          object_data: {
            type: "rect",
            width: 500,
            height: 150,
            fill: "#dbeafe",
            stroke: "#2563eb",
            strokeWidth: 3,
            rx: 10,
            ry: 10,
            left: 50,
            top: 100,
          },
          position_x: 50,
          position_y: 100,
          width: 500,
          height: 150,
        },
        {
          object_type: "i-text",
          object_data: {
            type: "i-text",
            text: "Vision & Mission",
            fontSize: 24,
            fontWeight: "bold",
            fill: "#1e40af",
            left: 70,
            top: 120,
          },
          position_x: 70,
          position_y: 120,
          width: 200,
          height: 30,
        },
        // Goals section
        {
          object_type: "i-text",
          object_data: {
            type: "i-text",
            text: "Key Goals:",
            fontSize: 22,
            fontWeight: "bold",
            fill: "#334155",
            left: 50,
            top: 280,
          },
          position_x: 50,
          position_y: 280,
          width: 150,
          height: 30,
        },
        // Goal 1
        {
          object_type: "rect",
          object_data: {
            type: "rect",
            width: 280,
            height: 100,
            fill: "#dcfce7",
            stroke: "#16a34a",
            strokeWidth: 2,
            rx: 6,
            ry: 6,
            left: 50,
            top: 330,
          },
          position_x: 50,
          position_y: 330,
          width: 280,
          height: 100,
        },
        {
          object_type: "i-text",
          object_data: {
            type: "i-text",
            text: "Goal 1",
            fontSize: 18,
            fontWeight: "bold",
            fill: "#166534",
            left: 70,
            top: 350,
          },
          position_x: 70,
          position_y: 350,
          width: 80,
          height: 25,
        },
        // Goal 2
        {
          object_type: "rect",
          object_data: {
            type: "rect",
            width: 280,
            height: 100,
            fill: "#dcfce7",
            stroke: "#16a34a",
            strokeWidth: 2,
            rx: 6,
            ry: 6,
            left: 360,
            top: 330,
          },
          position_x: 360,
          position_y: 330,
          width: 280,
          height: 100,
        },
        {
          object_type: "i-text",
          object_data: {
            type: "i-text",
            text: "Goal 2",
            fontSize: 18,
            fontWeight: "bold",
            fill: "#166534",
            left: 380,
            top: 350,
          },
          position_x: 380,
          position_y: 350,
          width: 80,
          height: 25,
        },
      ],
    },
  },
  {
    name: "User Journey Map",
    description: "Map out customer experiences and touchpoints",
    category: "client_collaboration",
    is_featured: false,
    tags: ["ux", "customer-journey", "mapping"],
    template_data: {
      settings: {
        backgroundColor: "#ffffff",
        gridEnabled: false,
      },
      objects: [
        // Title
        {
          object_type: "i-text",
          object_data: {
            type: "i-text",
            text: "User Journey Map",
            fontSize: 32,
            fontWeight: "bold",
            fill: "#1e293b",
            left: 50,
            top: 30,
          },
          position_x: 50,
          position_y: 30,
          width: 350,
          height: 40,
        },
        // Stages
        {
          object_type: "i-text",
          object_data: {
            type: "i-text",
            text: "Awareness",
            fontSize: 18,
            fontWeight: "bold",
            fill: "#7c3aed",
            left: 80,
            top: 100,
          },
          position_x: 80,
          position_y: 100,
          width: 120,
          height: 25,
        },
        {
          object_type: "circle",
          object_data: {
            type: "circle",
            radius: 40,
            fill: "#ede9fe",
            stroke: "#7c3aed",
            strokeWidth: 3,
            left: 100,
            top: 150,
          },
          position_x: 100,
          position_y: 150,
          width: 80,
          height: 80,
        },
        {
          object_type: "i-text",
          object_data: {
            type: "i-text",
            text: "Consideration",
            fontSize: 18,
            fontWeight: "bold",
            fill: "#2563eb",
            left: 280,
            top: 100,
          },
          position_x: 280,
          position_y: 100,
          width: 150,
          height: 25,
        },
        {
          object_type: "circle",
          object_data: {
            type: "circle",
            radius: 40,
            fill: "#dbeafe",
            stroke: "#2563eb",
            strokeWidth: 3,
            left: 320,
            top: 150,
          },
          position_x: 320,
          position_y: 150,
          width: 80,
          height: 80,
        },
        {
          object_type: "i-text",
          object_data: {
            type: "i-text",
            text: "Purchase",
            fontSize: 18,
            fontWeight: "bold",
            fill: "#16a34a",
            left: 530,
            top: 100,
          },
          position_x: 530,
          position_y: 100,
          width: 100,
          height: 25,
        },
        {
          object_type: "circle",
          object_data: {
            type: "circle",
            radius: 40,
            fill: "#dcfce7",
            stroke: "#16a34a",
            strokeWidth: 3,
            left: 540,
            top: 150,
          },
          position_x: 540,
          position_y: 150,
          width: 80,
          height: 80,
        },
        // Arrow connecting stages
        {
          object_type: "line",
          object_data: {
            type: "line",
            x1: 180,
            y1: 190,
            x2: 280,
            y2: 190,
            stroke: "#64748b",
            strokeWidth: 3,
          },
          position_x: 180,
          position_y: 190,
          width: 100,
          height: 3,
        },
        {
          object_type: "line",
          object_data: {
            type: "line",
            x1: 400,
            y1: 190,
            x2: 500,
            y2: 190,
            stroke: "#64748b",
            strokeWidth: 3,
          },
          position_x: 400,
          position_y: 190,
          width: 100,
          height: 3,
        },
      ],
    },
  },
  {
    name: "Kanban Board",
    description: "Organize tasks with a simple Kanban-style workflow",
    category: "team_building",
    is_featured: true,
    tags: ["kanban", "workflow", "tasks"],
    template_data: {
      settings: {
        backgroundColor: "#f8fafc",
        gridEnabled: false,
      },
      objects: [
        // Title
        {
          object_type: "i-text",
          object_data: {
            type: "i-text",
            text: "Team Kanban Board",
            fontSize: 32,
            fontWeight: "bold",
            fill: "#1e293b",
            left: 50,
            top: 30,
          },
          position_x: 50,
          position_y: 30,
          width: 350,
          height: 40,
        },
        // To Do column
        {
          object_type: "rect",
          object_data: {
            type: "rect",
            width: 280,
            height: 500,
            fill: "#ffffff",
            stroke: "#e2e8f0",
            strokeWidth: 2,
            rx: 8,
            ry: 8,
            left: 50,
            top: 100,
          },
          position_x: 50,
          position_y: 100,
          width: 280,
          height: 500,
        },
        {
          object_type: "i-text",
          object_data: {
            type: "i-text",
            text: "To Do",
            fontSize: 20,
            fontWeight: "bold",
            fill: "#475569",
            left: 160,
            top: 120,
          },
          position_x: 160,
          position_y: 120,
          width: 80,
          height: 25,
        },
        // In Progress column
        {
          object_type: "rect",
          object_data: {
            type: "rect",
            width: 280,
            height: 500,
            fill: "#ffffff",
            stroke: "#e2e8f0",
            strokeWidth: 2,
            rx: 8,
            ry: 8,
            left: 360,
            top: 100,
          },
          position_x: 360,
          position_y: 100,
          width: 280,
          height: 500,
        },
        {
          object_type: "i-text",
          object_data: {
            type: "i-text",
            text: "In Progress",
            fontSize: 20,
            fontWeight: "bold",
            fill: "#2563eb",
            left: 445,
            top: 120,
          },
          position_x: 445,
          position_y: 120,
          width: 130,
          height: 25,
        },
        // Done column
        {
          object_type: "rect",
          object_data: {
            type: "rect",
            width: 280,
            height: 500,
            fill: "#ffffff",
            stroke: "#e2e8f0",
            strokeWidth: 2,
            rx: 8,
            ry: 8,
            left: 670,
            top: 100,
          },
          position_x: 670,
          position_y: 100,
          width: 280,
          height: 500,
        },
        {
          object_type: "i-text",
          object_data: {
            type: "i-text",
            text: "Done",
            fontSize: 20,
            fontWeight: "bold",
            fill: "#16a34a",
            left: 780,
            top: 120,
          },
          position_x: 780,
          position_y: 120,
          width: 70,
          height: 25,
        },
      ],
    },
  },
  {
    name: "Product Roadmap",
    description: "Plan your product timeline with phases and milestones",
    category: "product_development",
    is_featured: false,
    tags: ["roadmap", "timeline", "product"],
    template_data: {
      settings: {
        backgroundColor: "#ffffff",
        gridEnabled: true,
      },
      objects: [
        // Title
        {
          object_type: "i-text",
          object_data: {
            type: "i-text",
            text: "Product Roadmap",
            fontSize: 36,
            fontWeight: "bold",
            fill: "#1e293b",
            left: 50,
            top: 30,
          },
          position_x: 50,
          position_y: 30,
          width: 350,
          height: 45,
        },
        // Timeline
        {
          object_type: "line",
          object_data: {
            type: "line",
            x1: 50,
            y1: 150,
            x2: 1000,
            y2: 150,
            stroke: "#64748b",
            strokeWidth: 4,
          },
          position_x: 50,
          position_y: 150,
          width: 950,
          height: 4,
        },
        // Q1
        {
          object_type: "i-text",
          object_data: {
            type: "i-text",
            text: "Q1",
            fontSize: 18,
            fontWeight: "bold",
            fill: "#475569",
            left: 120,
            top: 120,
          },
          position_x: 120,
          position_y: 120,
          width: 40,
          height: 25,
        },
        {
          object_type: "rect",
          object_data: {
            type: "rect",
            width: 200,
            height: 120,
            fill: "#f0f9ff",
            stroke: "#3b82f6",
            strokeWidth: 2,
            rx: 6,
            ry: 6,
            left: 50,
            top: 200,
          },
          position_x: 50,
          position_y: 200,
          width: 200,
          height: 120,
        },
        {
          object_type: "i-text",
          object_data: {
            type: "i-text",
            text: "Phase 1",
            fontSize: 16,
            fontWeight: "bold",
            fill: "#1e40af",
            left: 70,
            top: 220,
          },
          position_x: 70,
          position_y: 220,
          width: 80,
          height: 22,
        },
        // Q2
        {
          object_type: "i-text",
          object_data: {
            type: "i-text",
            text: "Q2",
            fontSize: 18,
            fontWeight: "bold",
            fill: "#475569",
            left: 380,
            top: 120,
          },
          position_x: 380,
          position_y: 120,
          width: 40,
          height: 25,
        },
        {
          object_type: "rect",
          object_data: {
            type: "rect",
            width: 200,
            height: 120,
            fill: "#f0fdf4",
            stroke: "#10b981",
            strokeWidth: 2,
            rx: 6,
            ry: 6,
            left: 290,
            top: 200,
          },
          position_x: 290,
          position_y: 200,
          width: 200,
          height: 120,
        },
        {
          object_type: "i-text",
          object_data: {
            type: "i-text",
            text: "Phase 2",
            fontSize: 16,
            fontWeight: "bold",
            fill: "#047857",
            left: 310,
            top: 220,
          },
          position_x: 310,
          position_y: 220,
          width: 80,
          height: 22,
        },
        // Q3
        {
          object_type: "i-text",
          object_data: {
            type: "i-text",
            text: "Q3",
            fontSize: 18,
            fontWeight: "bold",
            fill: "#475569",
            left: 620,
            top: 120,
          },
          position_x: 620,
          position_y: 120,
          width: 40,
          height: 25,
        },
        {
          object_type: "rect",
          object_data: {
            type: "rect",
            width: 200,
            height: 120,
            fill: "#fef3c7",
            stroke: "#f59e0b",
            strokeWidth: 2,
            rx: 6,
            ry: 6,
            left: 530,
            top: 200,
          },
          position_x: 530,
          position_y: 200,
          width: 200,
          height: 120,
        },
        {
          object_type: "i-text",
          object_data: {
            type: "i-text",
            text: "Phase 3",
            fontSize: 16,
            fontWeight: "bold",
            fill: "#b45309",
            left: 550,
            top: 220,
          },
          position_x: 550,
          position_y: 220,
          width: 80,
          height: 22,
        },
      ],
    },
  },
  {
    name: "Furniture Design Layout",
    description: "Plan furniture arrangements and interior layouts",
    category: "furniture_design",
    is_featured: false,
    tags: ["furniture", "interior", "layout"],
    template_data: {
      settings: {
        backgroundColor: "#fafafa",
        gridEnabled: true,
      },
      objects: [
        // Title
        {
          object_type: "i-text",
          object_data: {
            type: "i-text",
            text: "Furniture Layout Plan",
            fontSize: 32,
            fontWeight: "bold",
            fill: "#1e293b",
            left: 50,
            top: 30,
          },
          position_x: 50,
          position_y: 30,
          width: 400,
          height: 40,
        },
        // Room outline
        {
          object_type: "rect",
          object_data: {
            type: "rect",
            width: 600,
            height: 400,
            fill: "#ffffff",
            stroke: "#334155",
            strokeWidth: 4,
            rx: 0,
            ry: 0,
            left: 100,
            top: 100,
          },
          position_x: 100,
          position_y: 100,
          width: 600,
          height: 400,
        },
        // Sofa
        {
          object_type: "rect",
          object_data: {
            type: "rect",
            width: 200,
            height: 80,
            fill: "#a78bfa",
            stroke: "#6d28d9",
            strokeWidth: 2,
            rx: 4,
            ry: 4,
            left: 300,
            top: 350,
          },
          position_x: 300,
          position_y: 350,
          width: 200,
          height: 80,
        },
        {
          object_type: "i-text",
          object_data: {
            type: "i-text",
            text: "Sofa",
            fontSize: 14,
            fill: "#ffffff",
            left: 375,
            top: 380,
          },
          position_x: 375,
          position_y: 380,
          width: 50,
          height: 20,
        },
        // Coffee Table
        {
          object_type: "rect",
          object_data: {
            type: "rect",
            width: 120,
            height: 60,
            fill: "#fbbf24",
            stroke: "#d97706",
            strokeWidth: 2,
            rx: 4,
            ry: 4,
            left: 340,
            top: 260,
          },
          position_x: 340,
          position_y: 260,
          width: 120,
          height: 60,
        },
        {
          object_type: "i-text",
          object_data: {
            type: "i-text",
            text: "Table",
            fontSize: 12,
            fill: "#ffffff",
            left: 370,
            top: 280,
          },
          position_x: 370,
          position_y: 280,
          width: 50,
          height: 18,
        },
        // TV
        {
          object_type: "rect",
          object_data: {
            type: "rect",
            width: 300,
            height: 40,
            fill: "#1e293b",
            stroke: "#0f172a",
            strokeWidth: 2,
            rx: 2,
            ry: 2,
            left: 250,
            top: 120,
          },
          position_x: 250,
          position_y: 120,
          width: 300,
          height: 40,
        },
        {
          object_type: "i-text",
          object_data: {
            type: "i-text",
            text: "TV",
            fontSize: 14,
            fill: "#ffffff",
            left: 385,
            top: 130,
          },
          position_x: 385,
          position_y: 130,
          width: 30,
          height: 20,
        },
      ],
    },
  },
];

async function seedTemplates() {
  console.log('Starting template seed...');

  try {
    // Check if templates already exist
    const existingCount = await prisma.board_templates.count();

    if (existingCount > 0) {
      console.log(`Found ${existingCount} existing templates. Skipping seed.`);
      console.log('To re-seed, first delete existing templates.');
      return;
    }

    // Insert all templates
    for (const template of TEMPLATES) {
      const created = await prisma.board_templates.create({
        data: {
          ...template,
          is_public: true,
          use_count: 0,
          created_at: new Date(),
          updated_at: new Date(),
        },
      });

      console.log(`✓ Created template: ${created.name} (${created.category})`);
    }

    console.log(`\n✅ Successfully seeded ${TEMPLATES.length} templates!`);

    // Print summary
    const summary = TEMPLATES.reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    console.log('\nTemplates by category:');
    Object.entries(summary).forEach(([category, count]) => {
      console.log(`  ${category}: ${count}`);
    });

  } catch (error) {
    console.error('Error seeding templates:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seed
seedTemplates()
  .then(() => {
    console.log('\n✨ Template seed completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Template seed failed:', error);
    process.exit(1);
  });
