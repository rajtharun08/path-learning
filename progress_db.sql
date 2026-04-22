--
-- PostgreSQL database dump
--

\restrict wZBCxdCEYVz212INbwVOlu4u8aJubq3mwaGhHXphWLmdcQYRKB21P5SKkg2GhWZ

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
-- Name: learning_sessions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.learning_sessions (
    id character varying(36) NOT NULL,
    user_id character varying(36) NOT NULL,
    start_time timestamp with time zone NOT NULL,
    end_time timestamp with time zone
);


ALTER TABLE public.learning_sessions OWNER TO postgres;

--
-- Name: video_notes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.video_notes (
    id character varying(36) NOT NULL,
    user_id character varying(36) NOT NULL,
    video_id character varying(100) NOT NULL,
    content text NOT NULL,
    video_timestamp integer NOT NULL,
    created_at timestamp with time zone NOT NULL
);


ALTER TABLE public.video_notes OWNER TO postgres;

--
-- Name: video_progress; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.video_progress (
    id character varying(36) NOT NULL,
    user_id character varying(36) NOT NULL,
    video_id character varying(100) NOT NULL,
    watched_seconds integer NOT NULL,
    completed boolean NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    is_bookmarked boolean DEFAULT false
);


ALTER TABLE public.video_progress OWNER TO postgres;

--
-- Data for Name: learning_sessions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.learning_sessions (id, user_id, start_time, end_time) FROM stdin;
\.


--
-- Data for Name: video_notes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.video_notes (id, user_id, video_id, content, video_timestamp, created_at) FROM stdin;
1c7457f3-675a-4c54-b625-847fd6b33338	5ea9d9ff-cfca-4c9b-9f87-f86ac0d9a859	yy-RPsffuKk	ok	11	2026-04-21 20:14:26.10897+05:30
46609cb0-b97d-47b3-9333-c8a988beccb8	5ea9d9ff-cfca-4c9b-9f87-f86ac0d9a859	aj4L7U7alNU	completed	641	2026-04-21 21:03:36.845595+05:30
782d6465-dccf-483e-8a5b-6db8e410615b	5ea9d9ff-cfca-4c9b-9f87-f86ac0d9a859	us9MQNnAF1s	not working	0	2026-04-22 08:19:47.745992+05:30
\.


--
-- Data for Name: video_progress; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.video_progress (id, user_id, video_id, watched_seconds, completed, updated_at, is_bookmarked) FROM stdin;
6984a56b-117e-433a-9525-338180589f71	5ea9d9ff-cfca-4c9b-9f87-f86ac0d9a859	kP73mR9PX6w	1811	t	2026-04-21 21:03:11.468527+05:30	f
e9ad501f-22ca-46ee-a485-d30d87f337ce	5ea9d9ff-cfca-4c9b-9f87-f86ac0d9a859	U-5VHRvOFpA	1188	t	2026-04-21 21:03:16.205669+05:30	f
198efd11-e8a2-4f27-9adb-942284a06281	5ea9d9ff-cfca-4c9b-9f87-f86ac0d9a859	tVNcIMsExDg	1775	t	2026-04-21 21:03:19.509721+05:30	f
a10f69fb-06bd-4e85-a023-c2bdc428e758	5ea9d9ff-cfca-4c9b-9f87-f86ac0d9a859	aj4L7U7alNU	641	t	2026-04-21 21:03:42.077522+05:30	f
6b1801f7-258c-4511-8cdd-e9c26234a44f	5ea9d9ff-cfca-4c9b-9f87-f86ac0d9a859	yy-RPsffuKk	359	f	2026-04-21 21:02:56.935009+05:30	t
a51fcf96-7829-49f7-9539-cc6f373ee7b4	5ea9d9ff-cfca-4c9b-9f87-f86ac0d9a859	us9MQNnAF1s	0	f	2026-04-21 21:03:00.149227+05:30	f
917e88f7-51ab-4048-bb1a-5296aad7e18e	5ea9d9ff-cfca-4c9b-9f87-f86ac0d9a859	ZB-lGyNBXHI	0	f	2026-04-21 21:03:06.863478+05:30	f
\.


--
-- Name: learning_sessions learning_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.learning_sessions
    ADD CONSTRAINT learning_sessions_pkey PRIMARY KEY (id);


--
-- Name: video_notes video_notes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.video_notes
    ADD CONSTRAINT video_notes_pkey PRIMARY KEY (id);


--
-- Name: video_progress video_progress_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.video_progress
    ADD CONSTRAINT video_progress_pkey PRIMARY KEY (id);


--
-- Name: ix_learning_sessions_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_learning_sessions_user_id ON public.learning_sessions USING btree (user_id);


--
-- Name: ix_video_notes_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_video_notes_user_id ON public.video_notes USING btree (user_id);


--
-- Name: ix_video_notes_video_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_video_notes_video_id ON public.video_notes USING btree (video_id);


--
-- Name: ix_video_progress_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_video_progress_user_id ON public.video_progress USING btree (user_id);


--
-- Name: ix_video_progress_video_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_video_progress_video_id ON public.video_progress USING btree (video_id);


--
-- PostgreSQL database dump complete
--

\unrestrict wZBCxdCEYVz212INbwVOlu4u8aJubq3mwaGhHXphWLmdcQYRKB21P5SKkg2GhWZ

