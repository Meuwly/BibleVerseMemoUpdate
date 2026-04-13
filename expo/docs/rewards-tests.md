# Rewards Engine - Pseudo Tests

## Scenarios

1. **Surprise limit (max 2/day)**
   - Complete 3 verses on the same day with rewards + surprises enabled.
   - Expected: only 2 surprises appear, the 3rd completion never shows a surprise.

2. **No surprises after 22:00**
   - Set device time to 22:30.
   - Complete a verse with surprises enabled.
   - Expected: no surprise appears.

3. **One full-screen per session**
   - Trigger a daily or weekly milestone.
   - Complete another verse that would trigger a milestone.
   - Expected: only the first is full-screen, the second is a toast.

4. **Daily/weekly milestones**
   - Set daily goal to 3, weekly goal to 10.
   - Complete 3 verses in a day → daily milestone.
   - Complete 10 verses in the same week → weekly milestone.

5. **Streak with grace days reset**
   - Enable streak, complete a verse on day 1.
   - Skip one day, complete a verse (grace day used).
   - Skip a new month and complete a verse again.
   - Expected: grace days reset to 2 at new month.

6. **Settings off**
   - Disable rewards in settings.
   - Complete a verse.
   - Expected: no toast, no milestone, no surprise.
