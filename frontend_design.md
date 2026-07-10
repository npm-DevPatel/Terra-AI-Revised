from textwrap import dedent
from pathlib import Path

content = dedent("""
# Terra AI — Product Vision

## Overview

Terra AI is an **AI-native construction intelligence platform** focused on helping professionals understand land, plan developments, and manage projects with better data and AI assistance.

The platform consists of **three core products**:
- Terra Lens
- Terra Sim
- Terra Flow

Meanwhile, **Terra Copilot**, **Terra Maps**, and **Terra Studio** are shared capabilities available across all products.

---

# 1. Terra Lens

## Tagline
**See. Understand. Assess.**

## Core Capabilities

- Photo, drone, and satellite analysis
- Terrain understanding
- Risk detection
- Object detection and segmentation
- Feasibility scoring
- Infrastructure and drainage analysis

## Shared Capabilities

### Terra Copilot
Ask questions about the site in natural language.

### Terra Maps
View the site in geographic context with spatial layers.

### Terra Studio
Save analyses, collaborate with teammates, and share projects.

---

# 2. Terra Sim

## Initial Concept

A building simulation tool that could visualize future developments.

## Problem

A full real-time 3D simulation engine is extremely compute-intensive and unnecessary for the core value proposition.

## Final Direction

# **AI Planning Assistant for Architects**

Terra Sim helps architects make better decisions before detailed design begins.

## Site Planning

- Recommend building placement
- Suggest optimal orientation for daylight
- Propose entrance locations
- Allocate parking areas
- Preserve green spaces
- Plan service roads

## Feasibility Analysis

- Estimate buildable area
- Recommend setbacks
- Estimate site coverage
- Provide FAR estimates
- Identify slope constraints
- Highlight flood-risk considerations

## Environmental Intelligence

- Sun-path visualization
- Wind exposure analysis
- Drainage recommendations
- Tree preservation suggestions
- Noise exposure analysis
- View preservation opportunities

## Infrastructure Planning

- Water connection considerations
- Power access considerations
- Road accessibility
- Emergency vehicle access
- Pedestrian circulation

## Terra Copilot Examples

- "Where should I place a four-storey office?"
- "How can I maximize parking without sacrificing green space?"
- "What is the biggest planning constraint on this site?"
- "Suggest three layout options."

## Outputs

- Annotated site plans
- Constraint maps
- Heatmaps
- Recommended building footprints
- Suggested circulation paths
- Planning reports

## Strategic Positioning

> **Figma for construction planning, powered by AI.**

Terra Sim is a **pre-design platform** that accelerates early-stage planning rather than a heavy rendering engine.

## Shared Capabilities

### Terra Copilot
Provides planning recommendations and answers design questions.

### Terra Maps
Supplies surrounding infrastructure, terrain, and geographic context.

### Terra Studio
Enables collaborative reviews, comments, iterations, and project management.

---

# 3. Terra Flow

## Tagline
**Decide. Report. Monitor.**

## Core Capabilities

- AI-generated reports
- Construction progress monitoring
- Timeline comparisons
- Compliance documentation
- Client dashboards
- PDF and DOCX exports
- Historical change tracking

## Shared Capabilities

### Terra Copilot
Explains reports, summarizes findings, and generates executive summaries.

### Terra Maps
Tracks projects spatially and compares historical imagery.

### Terra Studio
Manages projects, approvals, comments, files, and stakeholders in one workspace.

---

# Shared Platform Layer

## Terra Copilot

The conversational intelligence layer available throughout Terra AI.

- Ask questions about any site
- Summarize risks
- Suggest planning strategies
- Generate reports
- Compare scenarios
- Assist with project management

---

## Terra Maps

The spatial intelligence layer.

- Interactive GIS views
- Terrain visualization
- Infrastructure layers
- Flood-risk overlays
- Historical imagery
- Regional analysis

---

## Terra Studio

The collaboration and operations layer.

- Project workspaces
- Team collaboration
- Comments and reviews
- Version history
- File management
- Approvals and sharing

---

# Customer Journey

```text
Terra Lens
      ↓
Understand the land

Terra Sim
      ↓
Plan the development

Terra Flow
      ↓
Decide, execute, and monitor