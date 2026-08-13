-- Allow re-requesting after a request is resolved.
--
-- friend_requests_directed_key was an UNCONDITIONAL unique index on
-- (sender_id, receiver_id), so once a request existed (even declined, or
-- accepted with the friendship later removed) a new request to the same
-- directed pair was permanently blocked. Only a PENDING request should be
-- unique per directed pair; that is already enforced by
-- friend_requests_pending_pair_key (which also prevents a pending request in
-- either direction). Dropping the unconditional index lets a sender re-request
-- after a decline or after the friendship is removed.

drop index public.friend_requests_directed_key;