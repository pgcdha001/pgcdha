const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/pgcdha');
    console.log('🚀 ULTIMATE ANALYSIS - FINDING EXACT RESULTS!');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// ULTIMATE BRUTE FORCE ANALYSIS
const ultimateAnalysis = async () => {
  try {
    console.log('\n🔥 ULTIMATE BRUTE FORCE ANALYSIS - EVERY POSSIBLE COMBINATION');
    console.log('='.repeat(90));
    
    const User = mongoose.model('User', require('../models/User').schema);
    
    // TARGET RESULTS (YOUR SPREADSHEET DATA)
    const targets = {
      monday: [30, 28, 18, 9, 6],
      tuesday: [27, 26, 8, 7, 4]
    };
    
    // ALL POSSIBLE DATE RANGES (PKT timezone focused)
    const dateRanges = {
      monday_pkt_extended: {
        start: new Date('2025-08-03T19:00:00.000Z'),
        end: new Date('2025-08-04T18:59:59.999Z')
      },
      monday_utc: {
        start: new Date('2025-08-04T00:00:00.000Z'),
        end: new Date('2025-08-04T23:59:59.999Z')
      },
      monday_pkt_exact: {
        start: new Date('2025-08-04T00:00:00+05:00'),
        end: new Date('2025-08-04T23:59:59+05:00')
      },
      tuesday_pkt_extended: {
        start: new Date('2025-08-04T19:00:00.000Z'),
        end: new Date('2025-08-05T18:59:59.999Z')
      },
      tuesday_utc: {
        start: new Date('2025-08-05T00:00:00.000Z'),
        end: new Date('2025-08-05T23:59:59.999Z')
      },
      tuesday_pkt_exact: {
        start: new Date('2025-08-05T00:00:00+05:00'),
        end: new Date('2025-08-05T23:59:59+05:00')
      }
    };
    
    // ALL POSSIBLE LEVEL COMBINATIONS
    const levelCombinations = [
      { name: 'L0-4', levels: [0, 1, 2, 3, 4] },
      { name: 'L1-5', levels: [1, 2, 3, 4, 5] },
      { name: 'L2-6', levels: [2, 3, 4, 5, 6] },
      { name: 'L1-4+0', levels: [1, 2, 3, 4, 0] },
      { name: 'L0-3+5', levels: [0, 1, 2, 3, 5] },
      { name: 'Custom1', levels: [1, 2, 3, 4, 6] },
      { name: 'Custom2', levels: [0, 2, 3, 4, 5] }
    ];
    
    // ALL POSSIBLE DATE FIELDS
    const dateFields = ['achievedOn', 'updatedOn', 'createdOn', '_id'];
    
    // ALL POSSIBLE QUERY METHODS
    const queryMethods = [
      'elemMatch_level_date',
      'elemMatch_date_only', 
      'user_date_with_level',
      'user_date_array_position',
      'aggregate_unwind',
      'raw_data_processing'
    ];
    
    console.log('\n🎯 STARTING BRUTE FORCE SEARCH...\n');
    
    let perfectMatches = [];
    let closeMatches = [];
    
    // BRUTE FORCE EVERY COMBINATION
    for (const [rangeName, range] of Object.entries(dateRanges)) {
      const dayType = rangeName.includes('monday') ? 'monday' : 'tuesday';
      const targetArray = targets[dayType];
      
      console.log(`\n📅 Testing ${rangeName}: ${range.start.toISOString()} to ${range.end.toISOString()}`);
      
      for (const levelCombo of levelCombinations) {
        for (const dateField of dateFields) {
          for (const method of queryMethods) {
            
            try {
              let results = [];
              
              // METHOD 1: elemMatch with level and date
              if (method === 'elemMatch_level_date') {
                for (const level of levelCombo.levels) {
                  let count = 0;
                  
                  if (dateField === '_id') {
                    count = await User.countDocuments({
                      levelHistory: {
                        $elemMatch: {
                          level: level,
                          _id: {
                            $gte: mongoose.Types.ObjectId.createFromTime(Math.floor(range.start.getTime() / 1000)),
                            $lte: mongoose.Types.ObjectId.createFromTime(Math.floor(range.end.getTime() / 1000))
                          }
                        }
                      }
                    });
                  } else {
                    const query = {
                      levelHistory: {
                        $elemMatch: { level: level }
                      }
                    };
                    if (dateField !== 'updatedOn' && dateField !== 'createdOn') {
                      query.levelHistory.$elemMatch[dateField] = { $gte: range.start, $lte: range.end };
                    }
                    count = await User.countDocuments(query);
                  }
                  results.push(count);
                }
              }
              
              // METHOD 2: elemMatch date only, then filter by level
              else if (method === 'elemMatch_date_only') {
                if (dateField === 'achievedOn') {
                  const users = await User.find({
                    levelHistory: {
                      $elemMatch: {
                        achievedOn: { $gte: range.start, $lte: range.end }
                      }
                    }
                  }).select('levelHistory');
                  
                  for (const level of levelCombo.levels) {
                    let count = 0;
                    users.forEach(user => {
                      const hasLevel = user.levelHistory.some(lh => 
                        lh.level === level && 
                        lh.achievedOn >= range.start && 
                        lh.achievedOn <= range.end
                      );
                      if (hasLevel) count++;
                    });
                    results.push(count);
                  }
                } else {
                  results = [0, 0, 0, 0, 0]; // Skip for other date fields
                }
              }
              
              // METHOD 3: User date fields with level check
              else if (method === 'user_date_with_level') {
                if (dateField === 'createdOn' || dateField === 'updatedOn' || dateField === '_id') {
                  for (const level of levelCombo.levels) {
                    let query = {
                      levelHistory: {
                        $elemMatch: { level: level }
                      }
                    };
                    
                    if (dateField === '_id') {
                      query._id = {
                        $gte: mongoose.Types.ObjectId.createFromTime(Math.floor(range.start.getTime() / 1000)),
                        $lte: mongoose.Types.ObjectId.createFromTime(Math.floor(range.end.getTime() / 1000))
                      };
                    } else {
                      query[dateField] = { $gte: range.start, $lte: range.end };
                    }
                    
                    const count = await User.countDocuments(query);
                    results.push(count);
                  }
                } else {
                  results = [0, 0, 0, 0, 0];
                }
              }
              
              // METHOD 4: User date with array position logic
              else if (method === 'user_date_array_position') {
                if (dateField === 'createdOn' || dateField === '_id') {
                  let query = {};
                  
                  if (dateField === '_id') {
                    query._id = {
                      $gte: mongoose.Types.ObjectId.createFromTime(Math.floor(range.start.getTime() / 1000)),
                      $lte: mongoose.Types.ObjectId.createFromTime(Math.floor(range.end.getTime() / 1000))
                    };
                  } else {
                    query[dateField] = { $gte: range.start, $lte: range.end };
                  }
                  
                  const users = await User.find(query).select('levelHistory');
                  
                  for (let arrayIndex = 0; arrayIndex < levelCombo.levels.length; arrayIndex++) {
                    let count = 0;
                    users.forEach(user => {
                      if (user.levelHistory && user.levelHistory[arrayIndex]) {
                        // Check if this array position has the expected level
                        const expectedLevel = levelCombo.levels[arrayIndex];
                        if (user.levelHistory[arrayIndex].level === expectedLevel) {
                          count++;
                        }
                      }
                    });
                    results.push(count);
                  }
                } else {
                  results = [0, 0, 0, 0, 0];
                }
              }
              
              // METHOD 5: Advanced aggregation
              else if (method === 'aggregate_unwind') {
                if (dateField === 'achievedOn') {
                  const aggResults = await User.aggregate([
                    { $unwind: '$levelHistory' },
                    {
                      $match: {
                        'levelHistory.achievedOn': { $gte: range.start, $lte: range.end }
                      }
                    },
                    {
                      $group: {
                        _id: '$levelHistory.level',
                        count: { $sum: 1 }
                      }
                    },
                    { $sort: { '_id': 1 } }
                  ]);
                  
                  for (const level of levelCombo.levels) {
                    const result = aggResults.find(r => r._id === level);
                    results.push(result ? result.count : 0);
                  }
                } else {
                  results = [0, 0, 0, 0, 0];
                }
              }
              
              // METHOD 6: Raw data processing (comprehensive)
              else if (method === 'raw_data_processing') {
                let baseQuery = {};
                
                if (dateField === '_id') {
                  baseQuery._id = {
                    $gte: mongoose.Types.ObjectId.createFromTime(Math.floor(range.start.getTime() / 1000)),
                    $lte: mongoose.Types.ObjectId.createFromTime(Math.floor(range.end.getTime() / 1000))
                  };
                } else if (dateField === 'createdOn' || dateField === 'updatedOn') {
                  baseQuery[dateField] = { $gte: range.start, $lte: range.end };
                } else {
                  baseQuery = {
                    levelHistory: {
                      $elemMatch: {
                        achievedOn: { $gte: range.start, $lte: range.end }
                      }
                    }
                  };
                }
                
                const users = await User.find(baseQuery).select('levelHistory');
                
                for (const level of levelCombo.levels) {
                  let count = 0;
                  users.forEach(user => {
                    if (user.levelHistory) {
                      const hasLevel = user.levelHistory.some(lh => lh.level === level);
                      if (hasLevel) count++;
                    }
                  });
                  results.push(count);
                }
              }
              
              // CHECK FOR MATCHES
              const resultsStr = JSON.stringify(results);
              const targetStr = JSON.stringify(targetArray);
              
              if (resultsStr === targetStr) {
                const match = {
                  rangeName,
                  levelCombo: levelCombo.name,
                  dateField,
                  method,
                  results,
                  target: targetArray,
                  score: 100
                };
                perfectMatches.push(match);
                console.log(`🎯 PERFECT MATCH! ${rangeName} | ${levelCombo.name} | ${dateField} | ${method}`);
                console.log(`   Results: [${results.join(', ')}] = Target: [${targetArray.join(', ')}]`);
              } else {
                // Check for close matches (within 1-2 difference)
                let score = 0;
                for (let i = 0; i < Math.min(results.length, targetArray.length); i++) {
                  const diff = Math.abs(results[i] - targetArray[i]);
                  if (diff === 0) score += 20;
                  else if (diff === 1) score += 10;
                  else if (diff === 2) score += 5;
                }
                
                if (score >= 60) { // At least 3 close matches
                  closeMatches.push({
                    rangeName,
                    levelCombo: levelCombo.name,
                    dateField,
                    method,
                    results,
                    target: targetArray,
                    score
                  });
                }
              }
              
            } catch (error) {
              // Skip errors silently for brute force
            }
          }
        }
      }
    }
    
    // SPECIAL TESTS - Custom logic based on findings
    console.log('\n🔬 RUNNING SPECIAL CUSTOM TESTS...');
    
    // Test 1: Check if it's about users created in date range with specific level progression
    for (const [rangeName, range] of Object.entries(dateRanges)) {
      const dayType = rangeName.includes('monday') ? 'monday' : 'tuesday';
      const targetArray = targets[dayType];
      
      try {
        // Get users created in date range
        const usersInRange = await User.find({
          createdOn: { $gte: range.start, $lte: range.end }
        }).select('levelHistory createdOn');
        
        // Method A: Count users by their HIGHEST achieved level
        const levelCounts = [0, 0, 0, 0, 0];
        usersInRange.forEach(user => {
          if (user.levelHistory && user.levelHistory.length > 0) {
            const maxLevel = Math.max(...user.levelHistory.map(lh => lh.level));
            if (maxLevel >= 1 && maxLevel <= 5) {
              levelCounts[maxLevel - 1]++;
            }
          }
        });
        
        if (JSON.stringify(levelCounts) === JSON.stringify(targetArray)) {
          perfectMatches.push({
            rangeName,
            levelCombo: 'HIGHEST_LEVEL',
            dateField: 'createdOn',
            method: 'users_by_max_level',
            results: levelCounts,
            target: targetArray,
            score: 100
          });
          console.log(`🎯 PERFECT MATCH! ${rangeName} | HIGHEST_LEVEL | createdOn | users_by_max_level`);
          console.log(`   Results: [${levelCounts.join(', ')}] = Target: [${targetArray.join(', ')}]`);
        }
        
        // Method B: Count users by level PROGRESSION in date range
        const progressionCounts = [0, 0, 0, 0, 0];
        usersInRange.forEach(user => {
          if (user.levelHistory && user.levelHistory.length > 0) {
            // Count each level the user has achieved
            [1, 2, 3, 4, 5].forEach((level, index) => {
              if (user.levelHistory.some(lh => lh.level === level)) {
                progressionCounts[index]++;
              }
            });
          }
        });
        
        if (JSON.stringify(progressionCounts) === JSON.stringify(targetArray)) {
          perfectMatches.push({
            rangeName,
            levelCombo: 'PROGRESSION',
            dateField: 'createdOn',
            method: 'users_with_level',
            results: progressionCounts,
            target: targetArray,
            score: 100
          });
          console.log(`🎯 PERFECT MATCH! ${rangeName} | PROGRESSION | createdOn | users_with_level`);
          console.log(`   Results: [${progressionCounts.join(', ')}] = Target: [${targetArray.join(', ')}]`);
        }
        
      } catch (error) {
        // Skip
      }
    }
    
    // RESULTS SUMMARY
    console.log('\n🏆 ANALYSIS COMPLETE - RESULTS SUMMARY');
    console.log('='.repeat(70));
    
    if (perfectMatches.length > 0) {
      console.log(`\n🎯 FOUND ${perfectMatches.length} PERFECT MATCHES:`);
      perfectMatches.forEach((match, index) => {
        console.log(`\n${index + 1}. PERFECT MATCH:`);
        console.log(`   Range: ${match.rangeName}`);
        console.log(`   Levels: ${match.levelCombo}`);
        console.log(`   Date Field: ${match.dateField}`);
        console.log(`   Method: ${match.method}`);
        console.log(`   Results: [${match.results.join(', ')}]`);
        console.log(`   Target:  [${match.target.join(', ')}] ✅`);
      });
    } else {
      console.log('\n❌ NO PERFECT MATCHES FOUND');
    }
    
    if (closeMatches.length > 0) {
      console.log(`\n🎯 FOUND ${closeMatches.length} CLOSE MATCHES (Score >= 60):`);
      closeMatches
        .sort((a, b) => b.score - a.score)
        .slice(0, 10)
        .forEach((match, index) => {
          console.log(`\n${index + 1}. Score: ${match.score}%`);
          console.log(`   Range: ${match.rangeName}`);
          console.log(`   Levels: ${match.levelCombo}`);
          console.log(`   Date Field: ${match.dateField}`);
          console.log(`   Method: ${match.method}`);
          console.log(`   Results: [${match.results.join(', ')}]`);
          console.log(`   Target:  [${match.target.join(', ')}]`);
        });
    }
    
    if (perfectMatches.length === 0 && closeMatches.length === 0) {
      console.log('\n🔍 NO MATCHES FOUND - NEED DEEPER INVESTIGATION');
      console.log('Your data might require a completely different approach...');
    }
    
    console.log('\n✅ Ultimate analysis complete!');
    
  } catch (error) {
    console.error('❌ Error during ultimate analysis:', error);
    console.error(error.stack);
  }
};

// Main execution
const runUltimateAnalysis = async () => {
  await connectDB();
  await ultimateAnalysis();
  await mongoose.connection.close();
  console.log('\n💾 Database connection closed.');
  process.exit(0);
};

// Handle uncaught exceptions
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
  process.exit(1);
});

// Run the ultimate analysis
runUltimateAnalysis();
