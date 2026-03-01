#!/usr/bin/env node

/**
 * Preprocess script to merge all chat data into a single JSON file
 * Run: node scripts/mergeData.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');
const recordDir = path.join(rootDir, 'docs/record');

// Read all round summaries
const roundSummaries = [];
for (let i = 1; i <= 7; i++) {
  const summaryPath = path.join(recordDir, `round_${i}/round_summary.json`);
  const summary = JSON.parse(fs.readFileSync(summaryPath, 'utf-8'));
  roundSummaries.push(summary);
}

// Read all chat data for rounds 1-7
const allChats = [];
for (let roundNum = 1; roundNum <= 7; roundNum++) {
  const roundDir = path.join(recordDir, `round_${roundNum}`);
  const entries = fs.readdirSync(roundDir);
  
  for (const entry of entries) {
    if (entry === 'round_summary.json') continue;
    
    const chatPath = path.join(roundDir, entry, 'chat.json');
    if (fs.existsSync(chatPath)) {
      const chatData = JSON.parse(fs.readFileSync(chatPath, 'utf-8'));
      allChats.push({
        round: roundNum,
        group: entry,
        messages: chatData
      });
    }
  }
}

// Read phase_d team data
const phaseDTeams = [];
for (let teamNum = 1; teamNum <= 12; teamNum++) {
  const teamDir = path.join(recordDir, `phase_d/team_${teamNum}`);
  const chatPath = path.join(teamDir, 'chat.json');
  const posterPath = path.join(teamDir, 'poster.md');
  
  if (fs.existsSync(chatPath)) {
    const chatData = JSON.parse(fs.readFileSync(chatPath, 'utf-8'));
    const posterData = fs.existsSync(posterPath) 
      ? fs.readFileSync(posterPath, 'utf-8') 
      : null;
    
    phaseDTeams.push({
      teamId: `team_${teamNum}`,
      messages: chatData,
      poster: posterData
    });
  }
}

// Read phase_e evaluation data
const phaseETeams = [];
for (let teamNum = 1; teamNum <= 12; teamNum++) {
  const teamDir = path.join(recordDir, `phase_e/team_${teamNum}`);
  const chatPath = path.join(teamDir, 'chat.json');
  const scoresPath = path.join(teamDir, 'scores.json');
  
  if (fs.existsSync(chatPath)) {
    const chatData = JSON.parse(fs.readFileSync(chatPath, 'utf-8'));
    const scoresData = fs.existsSync(scoresPath)
      ? JSON.parse(fs.readFileSync(scoresPath, 'utf-8'))
      : null;
    
    phaseETeams.push({
      teamId: `team_${teamNum}`,
      messages: chatData,
      scores: scoresData
    });
  }
}

// Read agents data
const agentsPath = path.join(recordDir, 'agents.json');
const agents = JSON.parse(fs.readFileSync(agentsPath, 'utf-8'));

// Merge everything
const mergedData = {
  agents,
  roundSummaries,
  discussionRounds: allChats,
  developmentPhase: phaseDTeams,
  evaluationPhase: phaseETeams,
  metadata: {
    totalDiscussionRounds: 7,
    messagesPerGroup: 20,
    totalDevelopmentTeams: 12,
    messagesPerTeamDev: 24,
    totalEvaluationTeams: 12,
    messagesPerTeamEval: 99,
    totalRounds: 7 * 20 + 24 + 99, // 263 rounds
    generatedAt: new Date().toISOString()
  }
};

// Write merged data
const outputPath = path.join(rootDir, 'docs/record/merged-data.json');
fs.writeFileSync(outputPath, JSON.stringify(mergedData, null, 2));

console.log(`✅ Merged data written to: ${outputPath}`);
console.log(`📊 Stats:`);
console.log(`   - Agents: ${agents.length}`);
console.log(`   - Discussion rounds: ${allChats.length} groups across 7 rounds`);
console.log(`   - Development teams: ${phaseDTeams.length}`);
console.log(`   - Evaluation teams: ${phaseETeams.length}`);
console.log(`   - Total frontend rounds: ${mergedData.metadata.totalRounds}`);
