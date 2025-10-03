import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/auth/supabase-server';
import { z } from 'zod';

const projectSchema = z.object({
  name: z.string().min(1, 'Project name is required'),
  description: z.string().min(1, 'Project description is required'),
  status: z.enum(['planning', 'active', 'completed', 'on-hold']).default('planning'),
  progress: z.number().min(0).max(100).default(0),
  due_date: z.string().optional(),
  team: z.array(z.string()).optional().default([]),
});

// GET /api/projects - List all projects
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    let query = supabase
      .from('crm_projects')
      .select('*')
      .order('created_at', { ascending: false });

    // Filter by status if provided
    if (status) {
      query = query.eq('status', status);
    }

    const { data: projects, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Fetch team members for all projects
    const projectIds = projects?.map(p => p.id) || [];
    let teamMembersMap: Record<number, string[]> = {};

    if (projectIds.length > 0) {
      const { data: teamMembers } = await supabase
        .from('crm_project_members')
        .select('project_id, member_name')
        .in('project_id', projectIds);

      // Group team members by project_id
      teamMembers?.forEach(member => {
        if (!teamMembersMap[member.project_id]) {
          teamMembersMap[member.project_id] = [];
        }
        teamMembersMap[member.project_id].push(member.member_name);
      });
    }

    // Enrich projects with team array and tasks object
    const enrichedProjects = projects?.map(project => ({
      ...project,
      team: teamMembersMap[project.id] || [],
      tasks: { total: 0, completed: 0 }, // TODO: Implement task counting
    })) || [];

    return NextResponse.json({ projects: enrichedProjects });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
      { status: 500 }
    );
  }
}

// POST /api/projects - Create a new project
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    const validatedData = projectSchema.parse(body);

    // Extract team array for separate insertion
    const { team, ...projectData } = validatedData;

    // Insert the project
    const { data: project, error: projectError } = await supabase
      .from('crm_projects')
      .insert([projectData])
      .select()
      .single();

    if (projectError) {
      return NextResponse.json({ error: projectError.message }, { status: 500 });
    }

    // Insert team members if provided
    if (team && team.length > 0) {
      const teamMembers = team.map(memberName => ({
        project_id: project.id,
        member_name: memberName,
      }));

      const { error: teamError } = await supabase
        .from('crm_project_members')
        .insert(teamMembers);

      if (teamError) {
        console.error('Error inserting team members:', teamError);
        // Don't fail the request, just log the error
      }
    }

    // Return project with team array and tasks object for frontend compatibility
    const enrichedProject = {
      ...project,
      team: team || [],
      tasks: { total: 0, completed: 0 },
    };

    return NextResponse.json({ project: enrichedProject }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to create project' },
      { status: 500 }
    );
  }
}
