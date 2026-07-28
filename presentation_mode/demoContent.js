export const lensDemoResponses = {
  land: 'These two marked pieces of land read differently. The lower parcel looks more open and buildable, with clearer room for access, drainage control, and a compact footprint. The upper parcel feels more exposed to slope movement and runoff from the surrounding terrain, so I would treat it as the parcel that needs more geotechnical caution before committing design capital.',
  hillside: 'Well, how you build aesthetically depends on both your preferences as a person and what exactly you are building. For a tourism estate, facing the hills is a strong design move because the view becomes part of the product: decks, glazing, arrival sequence, and outdoor rooms can all borrow from that landscape. For an ordinary residential home, I would still face key living spaces toward the hills, but balance that with privacy, wind exposure, morning light, and the cost of managing slope, drainage, and access.',
  sky: 'Yes, in Tigoni - it gets really cold, and dark cloud cover like this often points to moisture-heavy weather. I would assume the site is prone to rain and plan early for roof drainage, water harvesting, erosion control, covered walkways, and construction scheduling that respects the wet season.',
  comparison: 'Beautiful catch. The two circled areas are spaced apart, but they are not equal from a planning point of view. One appears more open, visually calmer, and easier to organize around access and a building footprint. The other sits closer to stronger terrain changes and visual interruptions, which means it may need more drainage thinking, slope checks, and careful orientation. If I were choosing between them, I would start feasibility on the cleaner, more open parcel first, then use the second as either a lower-intensity zone, landscape buffer, or future expansion area after survey confirmation.'
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
