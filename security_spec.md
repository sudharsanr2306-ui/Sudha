# Security Specification - Amplify Campus

## Data Invariants
1. A submission must belong to an existing active task.
2. An ambassador can only see their own submissions or public leaderboards.
3. Only admins can create/edit tasks and review submissions.
4. Points are only awarded by admins through the submission review process.
5. User roles are immutable once set (or only modifiable by super-admin, though we'll stick to basic admin lookup).

## The Dirty Dozen Payloads (Rejection Tests)
1. **Role Escalation**: Ambassador trying to change their own role to 'admin'.
2. **Ghost Points**: Ambassador trying to update their own `points` field.
3. **Task Manipulation**: Ambassador trying to create or delete a Task.
4. **ID Poisoning**: User trying to create a document with a 2KB junk string as ID.
5. **PII Leak**: Ambassador trying to read the full `users` collection.
6. **Task Spoofing**: Ambassador trying to submit for a task that doesn't exist.
7. **Cross-User Submission Edit**: Ambassador A trying to edit Ambassador B's submission.
8. **Shadow Field Injection**: Adding `isVerified: true` to a submission.
9. **Timestamp Fraud**: Providing a fake `submittedAt` from the future.
10. **Admin Identity Spoof**: User trying to write to `/admins/{uid}` (if we used that path for RBAC).
11. **Negative Points**: Admin trying to set points to -500 (validation check).
12. **Blanket Read Query**: Querying all submissions without a filter.

## Test Runner (Logic Check)
- `isValidId(id)` must be applied to all document paths.
- `isValid[Entity](data)` must be called on create/update.
- `affectedKeys().hasOnly()` must be used for partial updates (e.g., status changes).
- No blanket `allow read: if isSignedIn();` for sensitive collections.
