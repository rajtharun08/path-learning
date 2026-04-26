--
-- PostgreSQL database dump
--

\restrict 7Ykhglh4mBi90hdfbwNdzPkJ4eWX8MkWk0EfunzKKLUsikDQcWL3QeaPlhmwEbQ

-- Dumped from database version 18.2
-- Dumped by pg_dump version 18.2

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: playlists; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.playlists (
    id character varying(36) NOT NULL,
    youtube_playlist_id character varying(100) NOT NULL,
    title character varying(500) NOT NULL,
    description text,
    last_synced_at timestamp with time zone NOT NULL
);


ALTER TABLE public.playlists OWNER TO postgres;

--
-- Name: videos; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.videos (
    id character varying(36) NOT NULL,
    youtube_video_id character varying(100) NOT NULL,
    playlist_id character varying(36) NOT NULL,
    title character varying(500) NOT NULL,
    thumbnail character varying(500),
    duration integer NOT NULL,
    "position" integer NOT NULL
);


ALTER TABLE public.videos OWNER TO postgres;

--
-- Data for Name: playlists; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.playlists (id, youtube_playlist_id, title, description, last_synced_at) FROM stdin;
11111111-1111-1111-1111-111111111111	PL_TEST_001	Test Playlist	Seeded playlist for local integration testing	2026-04-09 10:47:19.925014+05:30
course-1	PL123-uiux	UI/UX Design Fundamentals	Master Figma, prototyping, and user journey flows.	2026-04-21 16:31:09.178364+05:30
course-2	PL123-react	React Complete Course 2024	Master React from basics to advanced concepts. Build real-world applications with hooks and context.	2026-04-21 16:31:09.178364+05:30
course-3	PL123-python	Data Science with Python	A comprehensive dive into Pandas, NumPy, and basic machine learning.	2026-04-21 16:31:09.178364+05:30
0786bfb1-11ea-47ef-a21c-28de7714acc8	PLUDwpEzHYYLs6I6jA_USsP3UWfS7EKCf2	JSON Tutorial for Beginners		2026-04-21 17:53:13.620731+05:30
\.


--
-- Data for Name: videos; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.videos (id, youtube_video_id, playlist_id, title, thumbnail, duration, "position") FROM stdin;
22222222-2222-2222-2222-222222222221	vid_1	11111111-1111-1111-1111-111111111111	Video 1	https://example.com/thumb1.jpg	600	1
22222222-2222-2222-2222-222222222222	vid_2	11111111-1111-1111-1111-111111111111	Video 2	https://example.com/thumb2.jpg	720	2
vid-1	yt-1	course-2	Introduction to React	https://images.unsplash.com/photo-1633356122544-f134324a6cee?q=80&w=600&auto=format&fit=crop	1200	1
vid-2	yt-2	course-2	State and Lifecycle	https://images.unsplash.com/photo-1633356122544-f134324a6cee?q=80&w=600&auto=format&fit=crop	1500	2
40042625-9b9a-4c70-9a7d-b44c88144a17	yy-RPsffuKk	0786bfb1-11ea-47ef-a21c-28de7714acc8	JSON Tutorial Part-1 | Introduction | Uses of JSON |Data Types |JSON Syntax	https://i.ytimg.com/vi/yy-RPsffuKk/hqdefault.jpg	432	0
355dfd25-fc8f-4d27-a843-b5a1a28ef184	us9MQNnAF1s	0786bfb1-11ea-47ef-a21c-28de7714acc8	JSON Tutorial Part-2 | JSON vs XML | JSON Object & JSON Array | JSON Examples	https://i.ytimg.com/vi/us9MQNnAF1s/hqdefault.jpg	944	1
ea0dec62-d1df-4461-957d-199353b8767f	ZB-lGyNBXHI	0786bfb1-11ea-47ef-a21c-28de7714acc8	JSON Tutorial Part-3 | How To Represent Data in JSON | Convert Data from Text to JSON	https://i.ytimg.com/vi/ZB-lGyNBXHI/hqdefault.jpg	789	2
d602f98e-c5fa-47ec-8186-10abf9b70dc4	kP73mR9PX6w	0786bfb1-11ea-47ef-a21c-28de7714acc8	JSON Tutorial Part-4 | How To Retrieve Data from JSON using JSON Path | JSON Path Expressions	https://i.ytimg.com/vi/kP73mR9PX6w/hqdefault.jpg	1922	3
584432dd-fa68-4b40-bdb9-3bae0642a0ba	U-5VHRvOFpA	0786bfb1-11ea-47ef-a21c-28de7714acc8	JSON Tutorial Part-5 | How To Read Data from JSON File in Java | JSON Simple API	https://i.ytimg.com/vi/U-5VHRvOFpA/hqdefault.jpg	1261	4
5a797b77-47e9-4ec3-b3f2-cf7ed40ddf21	tVNcIMsExDg	0786bfb1-11ea-47ef-a21c-28de7714acc8	JSON Tutorial Part-6 | Data Driven Testing in Selenium with Java using JSON File	https://i.ytimg.com/vi/tVNcIMsExDg/hqdefault.jpg	1826	5
b0c8c8ca-f163-4e99-8fc2-993a4eff284f	aj4L7U7alNU	0786bfb1-11ea-47ef-a21c-28de7714acc8	JSON Tutorial Part-7 | How To Read Data from JSON File in Python | JSON library in python	https://i.ytimg.com/vi/aj4L7U7alNU/hqdefault.jpg	648	6
\.


--
-- Name: playlists playlists_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.playlists
    ADD CONSTRAINT playlists_pkey PRIMARY KEY (id);


--
-- Name: videos videos_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.videos
    ADD CONSTRAINT videos_pkey PRIMARY KEY (id);


--
-- Name: ix_playlists_youtube_playlist_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX ix_playlists_youtube_playlist_id ON public.playlists USING btree (youtube_playlist_id);


--
-- Name: ix_videos_youtube_video_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX ix_videos_youtube_video_id ON public.videos USING btree (youtube_video_id);


--
-- Name: videos videos_playlist_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.videos
    ADD CONSTRAINT videos_playlist_id_fkey FOREIGN KEY (playlist_id) REFERENCES public.playlists(id);


--
-- PostgreSQL database dump complete
--

\unrestrict 7Ykhglh4mBi90hdfbwNdzPkJ4eWX8MkWk0EfunzKKLUsikDQcWL3QeaPlhmwEbQ

