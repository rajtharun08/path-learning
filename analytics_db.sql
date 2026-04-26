--
-- PostgreSQL database dump
--

\restrict pZ6OeM4YmYzbBSNopfcjvoWbmepr2ndA9Ud2nyXTxKfoIyOYZLg3HtaX1weP3od

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

--
-- Name: event_type_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.event_type_enum AS ENUM (
    'play',
    'pause',
    'seek',
    'complete',
    'path_view'
);


ALTER TYPE public.event_type_enum OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: video_events; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.video_events (
    id character varying(36) NOT NULL,
    user_id character varying(36) NOT NULL,
    video_id character varying(100) NOT NULL,
    event_type public.event_type_enum NOT NULL,
    position_seconds integer,
    "timestamp" timestamp with time zone NOT NULL
);


ALTER TABLE public.video_events OWNER TO postgres;

--
-- Data for Name: video_events; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.video_events (id, user_id, video_id, event_type, position_seconds, "timestamp") FROM stdin;
c8cab9cc-65a8-4edd-8b8c-af0342b71403	path_service	70a26ff3-9269-4270-a01f-f6af3d55afc3	path_view	0	2026-04-09 19:19:21.237923+05:30
26f46c84-bd2a-4eb3-827f-d1355a9fd834	path_service	70a26ff3-9269-4270-a01f-f6af3d55afc3	path_view	0	2026-04-09 19:22:42.115908+05:30
7fd67d1f-f573-4c65-ab99-a7858ff9d970	path_service	70a26ff3-9269-4270-a01f-f6af3d55afc3	path_view	0	2026-04-09 19:45:15.926437+05:30
4465c095-9217-4f8f-831b-20b60a497609	path_service	70a26ff3-9269-4270-a01f-f6af3d55afc3	path_view	0	2026-04-11 21:31:24.09733+05:30
82b7e127-a5a9-44e3-a64f-75b03ebc271a	path_service	b96b5184-3d6e-4d4c-be0b-9c09b2a67d64	path_view	0	2026-04-11 21:31:30.506858+05:30
847255d9-65cc-41a8-a177-beeb67f6a8c3	path_service	b96b5184-3d6e-4d4c-be0b-9c09b2a67d64	path_view	0	2026-04-11 21:31:57.597461+05:30
39896a9b-85db-4afd-8fdf-8086329afc59	path_service	70a26ff3-9269-4270-a01f-f6af3d55afc3	path_view	0	2026-04-11 21:31:59.947929+05:30
17c178a2-a8e8-4bc7-90d6-2695443e71a9	path_service	b96b5184-3d6e-4d4c-be0b-9c09b2a67d64	path_view	0	2026-04-11 21:33:10.16811+05:30
536098cf-f548-4009-a9bb-c68064a3fb2a	path_service	70a26ff3-9269-4270-a01f-f6af3d55afc3	path_view	0	2026-04-11 21:33:13.624928+05:30
191d6a74-baf8-4484-9783-6b368528e57f	path_service	70a26ff3-9269-4270-a01f-f6af3d55afc3	path_view	0	2026-04-11 21:34:14.933351+05:30
70f23687-28b1-4f07-a613-3909c02c105a	path_service	70a26ff3-9269-4270-a01f-f6af3d55afc3	path_view	0	2026-04-11 21:34:19.69424+05:30
58d8b937-ec0f-45f1-8478-70608856a2e6	path_service	70a26ff3-9269-4270-a01f-f6af3d55afc3	path_view	0	2026-04-11 21:34:30.051458+05:30
82305f6f-c29a-4bca-aaaa-400fd54182fb	path_service	b96b5184-3d6e-4d4c-be0b-9c09b2a67d64	path_view	0	2026-04-11 21:35:26.588898+05:30
5abdd7f0-c532-4e22-94f4-600a00378b63	path_service	b96b5184-3d6e-4d4c-be0b-9c09b2a67d64	path_view	0	2026-04-11 21:42:17.218479+05:30
86bafdfc-22fe-43da-baf1-05cd8720e25b	path_service	b96b5184-3d6e-4d4c-be0b-9c09b2a67d64	path_view	0	2026-04-11 21:44:13.950439+05:30
886e6faa-c41d-40e6-9d83-2a73dc29ec25	path_service	70a26ff3-9269-4270-a01f-f6af3d55afc3	path_view	0	2026-04-11 21:44:16.486061+05:30
f391c8c2-4d6c-4c66-a5bf-41f0eae67109	path_service	b96b5184-3d6e-4d4c-be0b-9c09b2a67d64	path_view	0	2026-04-11 21:45:29.105385+05:30
de062ee9-09a4-47bd-a3c4-e0286dfba8f6	path_service	b96b5184-3d6e-4d4c-be0b-9c09b2a67d64	path_view	0	2026-04-11 21:45:36.605339+05:30
08ce11bc-3d95-4000-98d9-e0321dd223f5	path_service	b96b5184-3d6e-4d4c-be0b-9c09b2a67d64	path_view	0	2026-04-11 21:45:39.745037+05:30
17b51f65-2ea5-44fe-b291-56e9a1c877ea	path_service	70a26ff3-9269-4270-a01f-f6af3d55afc3	path_view	0	2026-04-11 21:45:42.993499+05:30
709cd29f-8759-492f-a2bb-b6747b6bf449	path_service	70a26ff3-9269-4270-a01f-f6af3d55afc3	path_view	0	2026-04-11 21:45:44.628737+05:30
fe36d942-1b99-4e5d-8d31-1a836129bcad	path_service	b96b5184-3d6e-4d4c-be0b-9c09b2a67d64	path_view	0	2026-04-11 21:45:48.529319+05:30
a0519597-3983-4302-9d7d-0415de05a6b4	path_service	70a26ff3-9269-4270-a01f-f6af3d55afc3	path_view	0	2026-04-11 21:45:53.865464+05:30
feaad003-5b28-4173-9f9e-4dc841bbaf02	path_service	70a26ff3-9269-4270-a01f-f6af3d55afc3	path_view	0	2026-04-11 21:46:07.441061+05:30
053cac9e-340f-4f38-8035-bfe4c4184177	path_service	70a26ff3-9269-4270-a01f-f6af3d55afc3	path_view	0	2026-04-11 21:57:41.088991+05:30
db08d6b2-6539-47c1-af04-b0199c0d5f19	path_service	b96b5184-3d6e-4d4c-be0b-9c09b2a67d64	path_view	0	2026-04-11 21:58:01.506037+05:30
91a4725d-677f-42e9-b4c2-e4c153a1e7d2	path_service	95711b50-78b5-4cdd-9ecc-99c78f7dc322	path_view	0	2026-04-11 22:03:50.095266+05:30
f1ef10e4-8254-4cae-a6af-5de48a1f7420	path_service	70a26ff3-9269-4270-a01f-f6af3d55afc3	path_view	0	2026-04-11 22:10:59.665839+05:30
bf16d2fc-92b6-4e5e-a837-6452b168d291	path_service	95711b50-78b5-4cdd-9ecc-99c78f7dc322	path_view	0	2026-04-11 22:11:02.361022+05:30
16793197-ae11-4cbb-9026-591f7f96bf20	path_service	70a26ff3-9269-4270-a01f-f6af3d55afc3	path_view	0	2026-04-12 13:10:55.479189+05:30
a466706d-96fc-472a-8922-194b30f83911	path_service	95711b50-78b5-4cdd-9ecc-99c78f7dc322	path_view	0	2026-04-12 13:10:59.001756+05:30
0497e5ca-e1da-4c30-a6da-5e74a44fc5cf	path_service	95711b50-78b5-4cdd-9ecc-99c78f7dc322	path_view	0	2026-04-12 13:11:19.379075+05:30
50b6523f-3a6e-45f6-a7a4-7971b865bc27	path_service	95711b50-78b5-4cdd-9ecc-99c78f7dc322	path_view	0	2026-04-12 13:14:09.392229+05:30
\.


--
-- Name: video_events video_events_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.video_events
    ADD CONSTRAINT video_events_pkey PRIMARY KEY (id);


--
-- Name: ix_video_events_timestamp; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_video_events_timestamp ON public.video_events USING btree ("timestamp");


--
-- Name: ix_video_events_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_video_events_user_id ON public.video_events USING btree (user_id);


--
-- Name: ix_video_events_video_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_video_events_video_id ON public.video_events USING btree (video_id);


--
-- PostgreSQL database dump complete
--

\unrestrict pZ6OeM4YmYzbBSNopfcjvoWbmepr2ndA9Ud2nyXTxKfoIyOYZLg3HtaX1weP3od

