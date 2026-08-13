# Project Specification: Song Shout

## Overview

Song Shout is a web application where friends communicate by sending each other songs instead of (or alongside) text.

The application is not a music streaming platform. It is a social platform that uses songs as the message.

The primary interaction is called a **Shout**.

A shout is a song reference sent from one user to another. When someone receives a shout, they can see who sent it, which song was chosen, and interact with the song through the external music provider.

The purpose of the application is to make sharing songs between friends feel personal and intentional.

This project is intended as a **portfolio/personal project**. The focus is clean architecture, good UX, maintainable code, and demonstrating full-stack development skills.

---

# Primary Goal

Make sharing songs feel as easy and meaningful as sending a message.

Instead of writing:

> "This reminded me of you."

Users can send a song that represents the feeling or message.

---

# Core User Flow

## 1. Registration

A user creates an account.

Required:

* Username
* Display name
* Email
* Password

Optional:

* Profile picture

---

## 2. Login

Users authenticate and access their dashboard.

---

# 3. Add Friends

Users can only send shouts to friends.

Flow:

1. Search for a user by username.
2. Send a friend request.
3. Recipient accepts or declines.
4. Accepted users appear in each other's Friends list.

Friendship is mutual.

---

# 4. Send a Shout

The main feature of the application.

Flow:

1. User selects **Send Shout**.
2. User selects a friend.
3. User searches for a song.
4. Application retrieves songs through a music provider.
5. User selects a song.
6. User optionally adds a short message.
7. User sends the shout.

The recipient receives the shout notification.

---

# Song Discovery and Loading

Song Shout does not store or stream copyrighted music.

Instead, the application works similarly to a rich embed system, like how platforms display Spotify links.

The application stores a reference to a song from an external music provider and saves only the information required to display and interact with the shout.

The application uses a music provider API to search and retrieve song metadata.

Possible providers:

* Spotify
* Apple Music
* YouTube Music (future)
* Other providers implementing the provider interface

---

# Song Search Flow

When a user searches for a song:

1. User opens **Send Shout**.
2. User enters a search query.
3. Backend sends the request to the configured music provider.
4. Provider returns available song metadata.
5. User selects a song.
6. Application creates a song reference.
7. Shout is created using that song reference.

Example search:

```
Dreams
Fleetwood Mac
```

Provider response:

```
Title:
Dreams

Artist:
Fleetwood Mac

Album:
Rumours

Artwork:
provider image URL

Preview:
provider audio stream URL (if available; example: a 30-second
mp3 file hosted by the provider)

External Link:
provider song URL

Provider ID:
xxxxx
```

The application stores this information as a reference.

The application does not become the owner of the music.

---

# Song Playback

Song Shout is not a music streaming service.

The application does not:

* Store full songs
* Download music files
* Host copyrighted audio
* Stream complete tracks

Playback depends on what the external provider allows.

---

## If a Preview Exists

The application can display an internal preview player.

Example:

```
🎵 Dreams

Fleetwood Mac

▶ Play Preview
```

The preview is loaded directly from the music provider.

The application only provides the interface.

Implementation rule:

- The `previewUrl` field is a direct audio stream URL (such as an mp3 file) hosted by the provider.
- The frontend renders it in a standard `<audio>` element inside the shout view.
- The application must not re-host, download, or proxy the audio. It only points the player at the provider URL.
- If the preview fails to load (for example, the URL expires, is blocked, or is unreachable), the application hides the player and shows the external provider link instead. This is not an error state; the fallback IS the intended behavior.
- If the provider does not return a `previewUrl`, the "If No Preview Exists" case below applies.

---

## If No Preview Exists

The application provides an external provider link.

Example:

```
🎵 Dreams

Fleetwood Mac

Open in Spotify
```

The user is redirected to the provider's application or website.

---

# Music Provider Architecture

Music providers are isolated behind an abstraction layer.

The application should not directly depend on Spotify or any single provider.

Instead, it uses a provider interface.

Example:

```typescript
interface SongResult {
    provider: string
    providerSongId: string
    title: string
    artist: string
    album: string
    artworkUrl: string
    previewUrl: string | null      // direct audio stream URL, or null if provider has none
    externalUrl: string
    duration: number               // seconds, if available
}

interface MusicProvider {

    searchSongs(query: string): Promise<SongResult[]>

    getSong(id: string): Promise<SongResult>

}
```

Every `SongResult` returned by a provider MUST include these fields. `previewUrl` is the direct audio stream URL used for in-app preview playback; it may be `null` when the provider offers no preview for that song.

Example implementation:

```typescript
class SpotifyProvider implements MusicProvider {

    searchSongs(query: string) {
        // Spotify API search
    }

    getSong(id: string) {
        // Spotify API lookup
    }

}
```

Future providers can be added without changing application logic.

Example:

```typescript
class AppleMusicProvider implements MusicProvider {

}
```

The rest of the application only communicates with the provider interface.

---

# 5. Recipient Notification

When a shout is sent, the recipient receives a notification.

Example:

```
🎵 Alex shouted you out!

Mr. Brightside

The Killers

"Thought you'd like this."
```

Notification methods:

* In-app notifications
* Browser push notifications (optional)

---

# 6. Viewing a Shout

Opening a shout displays:

* Sender profile
* Song artwork
* Song title
* Artist
* Album
* Optional message
* Date sent
* Preview player (if available)
* External music provider link

Example:

```
Alex

sent you

Dreams

Fleetwood Mac

"This reminded me of our road trip."

▶ Play Preview

Open in Spotify
```

---

# 7. Reactions

Recipients can react to received shouts with emoji of choice.

A recipient can have one reaction per shout.

---

# Main Pages

## Landing Page

Contains:

* Project explanation
* Screenshots/mockups
* Login button
* Register button

---

## Authentication Pages

* Login
* Register
* Forgot password (optional)

---

## Dashboard

Displays:

* Recent shouts
* Recent notifications
* Quick Send button

---

## Friends Page

Contains:

* Current friends
* Incoming requests
* Outgoing requests
* User search
* Add friend
* Remove friend

---

## Send Shout Page

Contains:

* Friend selector
* Song search
* Song results
* Selected song information
* Optional message
* Send button

---

## Notifications Page

Displays:

* Received shouts
* Unread notifications
* Notification history

---

## Profile Page

Shows:

* Profile picture
* Username
* Display name
* Statistics
* Recent activity

---

# Database Model

## User

Fields:

* id
* username
* displayName
* email
* passwordHash
* avatarUrl
* createdAt

---

## Friend Request

Fields:

* id
* senderId
* receiverId
* status
* createdAt

Status:

* Pending
* Accepted
* Declined

---

## Friendship

Fields:

* id
* userId
* friendId
* createdAt

Represents an accepted friendship.

---

# Song Reference

The application does not own songs.

It stores references to external music providers.

## SongReference

Fields:

* id
* provider
* providerSongId
* title
* artist
* album
* artworkUrl
* previewUrl (direct audio stream URL from the provider, or null if unavailable)
* externalUrl
* duration
* createdAt

Purpose:

Stores the minimum information required to display a song and provide playback actions.

---

# Shout

Fields:

* id
* senderId
* receiverId
* songReferenceId
* message
* sentAt
* seenAt

A shout points to a song reference.

---

# Reaction

Fields:

* id
* shoutId
* userId
* reactionType

---

# Notification

Fields:

* id
* userId
* type
* relatedEntityId
* read
* createdAt

---

# Recommended Tech Stack

## Frontend

* Next.js
* React
* TypeScript
* Tailwind CSS

## Backend

* Supabase Authentication
* PostgreSQL
* Supabase Storage (avatars)
* Supabase Realtime (notifications)

## Music System

Music providers are accessed through the provider abstraction layer.

Initial provider:

* Spotify API

Possible future providers:

* Apple Music
* YouTube Music

---

# Architecture

```
Frontend
 |
 |
Next.js / React
 |
 |
Backend Services
 |
 |
Music Provider Layer
 |
 +----------------+
 |                |
Spotify API   Future APIs
 |
 |
Song Metadata
 |
 |
Database
 |
 |
Shouts
```

The application stores:

✅ Song metadata
✅ Provider reference
✅ Provider song ID
✅ Preview URL (if available)
✅ External provider link

The application does not store:

❌ Full songs
❌ Audio files
❌ Complete music streams

---

# Functional Requirements

Users can:

* Register
* Log in
* Edit profile
* Add friends
* Accept friend requests
* Remove friends
* Search songs
* Send shouts
* Receive notifications
* React to shouts

---

# Non-Functional Requirements

* Responsive design
* Accessible UI
* Secure authentication
* Server-side authorization
* Type-safe code
* Modular architecture
* Reusable components
* Clean separation between UI, business logic, and external services

---

# Design Principles

The application should feel personal, simple, and music-focused.

The main action should always be easy to access:

**Choose friend → Choose song → Send shout**

Avoid unnecessary complexity.

The application should not attempt to replace music services. It should enhance the social experience around music sharing.

---

# Version 1 Scope

Included:

* Authentication
* Friend system
* Song search
* External music provider integration
* Sending shouts
* Receiving notifications
* Song metadata display
* External music links
* Preview playback when supported
* Reactions
* Profiles

Explicitly excluded:

* Direct messaging/chat
* Group shouts
* Anonymous shouts
* Mood-based recommendations
* Birthday features
* AI recommendations
* Playlists
* Comments
* Music hosting
* Full song playback
* Monetization
* Admin panel

---

# AI Development Guidance

When generating code for this project:

* Do not create a music streaming system.
* Do not download or store audio files.
* Treat songs as external references.
* Use the music provider abstraction layer.
* Do not couple business logic directly to Spotify.
* Keep provider-specific code isolated.
* Avoid inventing unsupported APIs.
* Prefer simple maintainable solutions over unnecessary complexity.
* Do not add features outside the defined scope unless explicitly requested.
* If a provider limitation exists, handle it gracefully instead of creating unsupported functionality.
