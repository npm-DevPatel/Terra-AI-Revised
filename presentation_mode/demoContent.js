export const lensDemoResponses = {
  land: 'This marked land is the strongest buildable zone in the image. Terra would prioritize geotechnical confirmation, drainage design along the lower edge, and a compact building footprint that preserves the natural fall of the site.',
  hillside: 'The red hillside is the main terrain risk. It can send runoff toward the lower parcels during heavy rain, so Terra recommends slope-stability review, terracing where needed, and stormwater interception before foundations are finalized.',
  sky: 'The green sky region signals open exposure and likely high rainfall variability in this landscape. Terra would treat weather as a planning factor: roof drainage, water harvesting, erosion control, and construction scheduling should be handled early.'
};

export const plannerGeneration = {
  phrases: ['Ideas Taking Shape', 'Building the Physical World', 'Generating Your Plan'],
  readyMessage: 'Your Plan is generated, you can open your plan'
};

export const plannerDemo = {
  project: {
    name: 'Kilimani Residences',
    type: '120 Unit Apartment Complex',
    summary: 'Kilimani Residences is suitable for a medium-density residential development. Current priority is completing the geotechnical survey before structural design.'
  },
  overview: {
    health: [
      { label: 'Project Health', value: '91%', status: 'good' },
      { label: 'Budget Health', value: 'On track', status: 'good' },
      { label: 'Timeline Confidence', value: 'Moderate', status: 'warn' },
      { label: 'Top Risk', value: 'Drainage and geotech', status: 'risk' },
      { label: 'Team Activity', value: 'Active', status: 'good' }
    ],
    decisions: ['Approve Geotechnical Survey', 'Begin Permit Submission', 'Verify Utility Connections'],
    activity: ['Architect uploaded Revision B', 'Surveyor uploaded Drone Survey', 'Client approved Concept Design', 'Terra detected 3 decisions requiring review']
  },
  site: {
    recommendation: 'This site is highly suitable for a 120-unit apartment development. Drainage mitigation is recommended along the western boundary.',
    sections: ['Original Site Images', 'Annotated Images', 'Terrain Analysis', 'Drainage', 'Vegetation', 'Utilities', 'Road Access', 'Buildability Score', 'Site Constraints', 'AI Recommendations'],
    metrics: [
      { label: 'Buildability Score', value: '84/100' },
      { label: 'Drainage Sensitivity', value: 'Medium' },
      { label: 'Road Access', value: 'Good' },
      { label: 'Vegetation Impact', value: 'Manageable' }
    ]
  },
  plan: {
    modules: ['Feasibility Checklist', 'Geotechnical Survey', 'Environmental Assessment', 'Utility Verification', 'Legal Documentation', 'Architectural Planning', 'Structural Planning', 'Permit Tracking'],
    questions: ['What should I do first?', "What's the biggest risk?", 'What approvals are missing?', 'If this were your project what would you do next?', 'Explain this project in 30 seconds.', 'How can I reduce delays?']
  },
  build: {
    checklist: [
      { label: 'Site Preparation', complete: 100 },
      { label: 'Excavation', complete: 65 },
      { label: 'Foundation', complete: 28 },
      { label: 'Structural Works', complete: 0 },
      { label: 'Roofing', complete: 0 },
      { label: 'MEP', complete: 0 },
      { label: 'Interior Finishes', complete: 0 },
      { label: 'Landscaping', complete: 0 },
      { label: 'Final Inspection', complete: 0 }
    ],
    insight: 'AI recommendations update continuously as execution progress, budget changes, and site reports arrive.'
  },
  resources: {
    materials: ['Cement Suppliers', 'Steel Suppliers', 'Ready Mix Concrete', 'Timber Suppliers', 'Electrical Suppliers', 'Plumbing Suppliers'],
    services: ['Architects', 'Structural Engineers', 'Surveyors', 'Contractors', 'Equipment Rental', 'Environmental Consultants'],
    future: 'Terra recommends the best suppliers based on price, distance, and availability.'
  },
  budget: {
    sections: ['Estimated Cost', 'Actual Cost', 'Procurement', 'Material Costs', 'Labour Costs', 'Budget Breakdown', 'Budget Health'],
    insights: ['Foundation redesign may increase costs by approximately 8%.', 'Delaying procurement could reduce storage expenses.']
  },
  workspace: {
    features: ['Team Invitations', 'Messages', 'Audio Calls', 'Video Meetings', 'Shared Files', 'Comments', 'Activity Feed'],
    demo: ['Building footprint increased by 12%.', 'Estimated concrete volume increased.', 'Structural review recommended before approval.']
  },
  reports: {
    available: ['Executive Report', 'Investor Report', 'Architect Report', 'Site Report', 'Weekly Progress Report', 'Compliance Report'],
    includes: ['Executive Summary', 'Site Intelligence', 'Risks', 'Opportunities', 'AI Recommendations', 'Images']
  }
};
