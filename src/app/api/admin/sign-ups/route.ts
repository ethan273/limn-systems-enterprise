import { NextRequest, NextResponse } from 'next/server';

export async function GET(_request: NextRequest) {
  try {
    // Mock data for now - replace with actual database query
    const signUps = [
      {
        id: '1',
        email: 'john.doe@example.com',
        firstName: 'John',
        lastName: 'Doe',
        companyName: 'Example Corp',
        phoneNumber: '+1-555-0123',
        businessJustification: 'Need access for project management',
        referralSource: 'Google Search',
        emailVerified: true,
        requestedAt: new Date().toISOString(),
        status: 'PENDING'
      },
      {
        id: '2',
        email: 'jane.smith@company.com',
        firstName: 'Jane',
        lastName: 'Smith',
        companyName: 'Tech Solutions LLC',
        phoneNumber: '+1-555-0456',
        businessJustification: 'Managing client projects',
        referralSource: 'Referral',
        emailVerified: false,
        requestedAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
        status: 'PENDING'
      }
    ];

    return NextResponse.json({
      success: true,
      signUps,
      total: signUps.length
    });

  } catch (error) {
    console.error('Error fetching sign-ups:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch sign-ups',
        signUps: [],
        total: 0
      },
      { status: 500 }
    );
  }
}