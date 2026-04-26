--
-- PostgreSQL database dump
--

\restrict sYuTANoVkNjUY47qO4q3cT9uDgLcrV859byFcMch8uGWTZl9QJ7p3ZYMaOL4KgK

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
-- Name: learning_history; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.learning_history (
    id integer NOT NULL,
    user_id uuid NOT NULL,
    path_id uuid NOT NULL,
    event_type character varying(50) NOT NULL,
    progress_percentage double precision NOT NULL,
    next_up_playlist_id character varying(255),
    created_at timestamp with time zone NOT NULL,
    total_courses integer DEFAULT 0 NOT NULL,
    completed_courses integer DEFAULT 0 NOT NULL,
    remaining_courses integer DEFAULT 0 NOT NULL
);


ALTER TABLE public.learning_history OWNER TO postgres;

--
-- Name: learning_history_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.learning_history_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.learning_history_id_seq OWNER TO postgres;

--
-- Name: learning_history_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.learning_history_id_seq OWNED BY public.learning_history.id;


--
-- Name: learning_paths; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.learning_paths (
    path_id uuid NOT NULL,
    title character varying(255) NOT NULL,
    description text NOT NULL,
    editor_name character varying(255) NOT NULL,
    total_views integer NOT NULL,
    average_completion_rate double precision NOT NULL,
    rating double precision NOT NULL
);


ALTER TABLE public.learning_paths OWNER TO postgres;

--
-- Name: path_enrollments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.path_enrollments (
    id integer NOT NULL,
    user_id uuid NOT NULL,
    path_id uuid NOT NULL,
    enrolled_at timestamp with time zone NOT NULL
);


ALTER TABLE public.path_enrollments OWNER TO postgres;

--
-- Name: path_enrollments_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.path_enrollments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.path_enrollments_id_seq OWNER TO postgres;

--
-- Name: path_enrollments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.path_enrollments_id_seq OWNED BY public.path_enrollments.id;


--
-- Name: path_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.path_items (
    id integer NOT NULL,
    path_id uuid NOT NULL,
    playlist_id character varying(255) NOT NULL,
    sequence_order integer NOT NULL
);


ALTER TABLE public.path_items OWNER TO postgres;

--
-- Name: path_items_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.path_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.path_items_id_seq OWNER TO postgres;

--
-- Name: path_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.path_items_id_seq OWNED BY public.path_items.id;


--
-- Name: learning_history id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.learning_history ALTER COLUMN id SET DEFAULT nextval('public.learning_history_id_seq'::regclass);


--
-- Name: path_enrollments id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.path_enrollments ALTER COLUMN id SET DEFAULT nextval('public.path_enrollments_id_seq'::regclass);


--
-- Name: path_items id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.path_items ALTER COLUMN id SET DEFAULT nextval('public.path_items_id_seq'::regclass);


--
-- Data for Name: learning_history; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.learning_history (id, user_id, path_id, event_type, progress_percentage, next_up_playlist_id, created_at, total_courses, completed_courses, remaining_courses) FROM stdin;
5	5ea9d9ff-cfca-4c9b-9f87-f86ac0d9a859	11111111-1111-4111-a111-111111111111	progress_updated	0	course-1	2026-04-21 17:11:12.985399+05:30	2	0	2
6	5ea9d9ff-cfca-4c9b-9f87-f86ac0d9a859	11111111-1111-4111-a111-111111111111	progress_updated	0	course-1	2026-04-21 17:11:18.248787+05:30	2	0	2
7	5ea9d9ff-cfca-4c9b-9f87-f86ac0d9a859	11111111-1111-4111-a111-111111111111	progress_updated	0	course-1	2026-04-21 17:11:23.403984+05:30	2	0	2
8	5ea9d9ff-cfca-4c9b-9f87-f86ac0d9a859	11111111-1111-4111-a111-111111111111	progress_updated	0	course-1	2026-04-21 17:11:28.55204+05:30	2	0	2
9	5ea9d9ff-cfca-4c9b-9f87-f86ac0d9a859	22222222-2222-4222-a222-222222222222	progress_updated	0	course-3	2026-04-21 17:17:55.439573+05:30	1	0	1
10	5ea9d9ff-cfca-4c9b-9f87-f86ac0d9a859	22222222-2222-4222-a222-222222222222	progress_updated	0	course-3	2026-04-21 17:18:00.383886+05:30	1	0	1
11	5ea9d9ff-cfca-4c9b-9f87-f86ac0d9a859	22222222-2222-4222-a222-222222222222	progress_updated	0	course-3	2026-04-21 17:18:05.20503+05:30	1	0	1
12	5ea9d9ff-cfca-4c9b-9f87-f86ac0d9a859	22222222-2222-4222-a222-222222222222	progress_updated	0	course-3	2026-04-21 17:18:10.000725+05:30	1	0	1
13	5ea9d9ff-cfca-4c9b-9f87-f86ac0d9a859	22222222-2222-4222-a222-222222222222	progress_updated	0	course-3	2026-04-21 17:18:14.692055+05:30	1	0	1
14	5ea9d9ff-cfca-4c9b-9f87-f86ac0d9a859	22222222-2222-4222-a222-222222222222	progress_updated	0	course-3	2026-04-21 17:18:19.45506+05:30	1	0	1
15	5ea9d9ff-cfca-4c9b-9f87-f86ac0d9a859	11111111-1111-4111-a111-111111111111	progress_updated	0	course-1	2026-04-21 17:28:24.23869+05:30	2	0	2
16	5ea9d9ff-cfca-4c9b-9f87-f86ac0d9a859	11111111-1111-4111-a111-111111111111	progress_updated	0	course-1	2026-04-21 17:28:29.871953+05:30	2	0	2
17	5ea9d9ff-cfca-4c9b-9f87-f86ac0d9a859	22222222-2222-4222-a222-222222222222	progress_updated	0	course-3	2026-04-21 17:28:32.989129+05:30	1	0	1
18	5ea9d9ff-cfca-4c9b-9f87-f86ac0d9a859	22222222-2222-4222-a222-222222222222	progress_updated	0	course-3	2026-04-21 17:28:37.769865+05:30	1	0	1
19	5ea9d9ff-cfca-4c9b-9f87-f86ac0d9a859	11111111-1111-4111-a111-111111111111	progress_updated	0	course-1	2026-04-21 17:28:54.608058+05:30	2	0	2
20	5ea9d9ff-cfca-4c9b-9f87-f86ac0d9a859	11111111-1111-4111-a111-111111111111	progress_updated	0	course-1	2026-04-21 17:28:59.762611+05:30	2	0	2
21	5ea9d9ff-cfca-4c9b-9f87-f86ac0d9a859	11111111-1111-4111-a111-111111111111	progress_updated	0	course-1	2026-04-21 17:40:30.716871+05:30	2	0	2
22	5ea9d9ff-cfca-4c9b-9f87-f86ac0d9a859	22222222-2222-4222-a222-222222222222	progress_updated	0	course-3	2026-04-21 17:40:34.735909+05:30	1	0	1
23	5ea9d9ff-cfca-4c9b-9f87-f86ac0d9a859	22222222-2222-4222-a222-222222222222	progress_updated	0	course-3	2026-04-21 17:40:39.60041+05:30	1	0	1
24	5ea9d9ff-cfca-4c9b-9f87-f86ac0d9a859	22222222-2222-4222-a222-222222222222	progress_updated	0	course-3	2026-04-21 17:40:44.335972+05:30	1	0	1
25	5ea9d9ff-cfca-4c9b-9f87-f86ac0d9a859	22222222-2222-4222-a222-222222222222	progress_updated	0	course-3	2026-04-21 17:40:49.135845+05:30	1	0	1
26	5ea9d9ff-cfca-4c9b-9f87-f86ac0d9a859	11111111-1111-4111-a111-111111111111	progress_updated	0	course-1	2026-04-21 17:41:33.20146+05:30	2	0	2
27	5ea9d9ff-cfca-4c9b-9f87-f86ac0d9a859	11111111-1111-4111-a111-111111111111	progress_updated	0	course-1	2026-04-21 17:41:38.346072+05:30	2	0	2
28	5ea9d9ff-cfca-4c9b-9f87-f86ac0d9a859	b658952b-d52d-4e7a-846d-552b4f9abb3f	enrolled	0	\N	2026-04-21 18:01:11.813172+05:30	0	0	0
29	5ea9d9ff-cfca-4c9b-9f87-f86ac0d9a859	b658952b-d52d-4e7a-846d-552b4f9abb3f	progress_updated	0	PLUDwpEzHYYLs6I6jA_USsP3UWfS7EKCf2	2026-04-21 18:01:17.044619+05:30	1	0	1
30	5ea9d9ff-cfca-4c9b-9f87-f86ac0d9a859	b658952b-d52d-4e7a-846d-552b4f9abb3f	progress_updated	0	PLUDwpEzHYYLs6I6jA_USsP3UWfS7EKCf2	2026-04-21 18:01:21.843233+05:30	1	0	1
31	5ea9d9ff-cfca-4c9b-9f87-f86ac0d9a859	b658952b-d52d-4e7a-846d-552b4f9abb3f	progress_updated	0	PLUDwpEzHYYLs6I6jA_USsP3UWfS7EKCf2	2026-04-21 18:01:26.53095+05:30	1	0	1
32	5ea9d9ff-cfca-4c9b-9f87-f86ac0d9a859	b658952b-d52d-4e7a-846d-552b4f9abb3f	progress_updated	0	PLUDwpEzHYYLs6I6jA_USsP3UWfS7EKCf2	2026-04-21 18:01:31.21491+05:30	1	0	1
33	5ea9d9ff-cfca-4c9b-9f87-f86ac0d9a859	11111111-1111-4111-a111-111111111111	progress_updated	0	course-1	2026-04-21 18:02:59.564629+05:30	2	0	2
34	5ea9d9ff-cfca-4c9b-9f87-f86ac0d9a859	11111111-1111-4111-a111-111111111111	progress_updated	0	course-1	2026-04-21 18:03:07.136419+05:30	2	0	2
35	5ea9d9ff-cfca-4c9b-9f87-f86ac0d9a859	11111111-1111-4111-a111-111111111111	progress_updated	0	course-1	2026-04-21 18:03:14.93456+05:30	2	0	2
36	5ea9d9ff-cfca-4c9b-9f87-f86ac0d9a859	11111111-1111-4111-a111-111111111111	progress_updated	0	course-1	2026-04-21 18:03:23.191399+05:30	2	0	2
37	5ea9d9ff-cfca-4c9b-9f87-f86ac0d9a859	11111111-1111-4111-a111-111111111111	progress_updated	0	course-1	2026-04-21 18:03:30.857052+05:30	2	0	2
38	5ea9d9ff-cfca-4c9b-9f87-f86ac0d9a859	11111111-1111-4111-a111-111111111111	progress_updated	0	course-1	2026-04-21 18:03:38.557004+05:30	2	0	2
39	5ea9d9ff-cfca-4c9b-9f87-f86ac0d9a859	b658952b-d52d-4e7a-846d-552b4f9abb3f	progress_updated	0	PLUDwpEzHYYLs6I6jA_USsP3UWfS7EKCf2	2026-04-21 19:28:36.757106+05:30	1	0	1
40	5ea9d9ff-cfca-4c9b-9f87-f86ac0d9a859	b658952b-d52d-4e7a-846d-552b4f9abb3f	progress_updated	0	PLUDwpEzHYYLs6I6jA_USsP3UWfS7EKCf2	2026-04-21 19:28:41.519038+05:30	1	0	1
41	5ea9d9ff-cfca-4c9b-9f87-f86ac0d9a859	b658952b-d52d-4e7a-846d-552b4f9abb3f	progress_updated	0	PLUDwpEzHYYLs6I6jA_USsP3UWfS7EKCf2	2026-04-21 19:31:11.355688+05:30	1	0	1
42	5ea9d9ff-cfca-4c9b-9f87-f86ac0d9a859	b658952b-d52d-4e7a-846d-552b4f9abb3f	progress_updated	0	PLUDwpEzHYYLs6I6jA_USsP3UWfS7EKCf2	2026-04-21 19:31:16.161245+05:30	1	0	1
43	5ea9d9ff-cfca-4c9b-9f87-f86ac0d9a859	b658952b-d52d-4e7a-846d-552b4f9abb3f	progress_updated	0	PLUDwpEzHYYLs6I6jA_USsP3UWfS7EKCf2	2026-04-21 19:32:22.283084+05:30	1	0	1
44	5ea9d9ff-cfca-4c9b-9f87-f86ac0d9a859	b658952b-d52d-4e7a-846d-552b4f9abb3f	progress_updated	0	PLUDwpEzHYYLs6I6jA_USsP3UWfS7EKCf2	2026-04-21 19:32:26.975718+05:30	1	0	1
45	5ea9d9ff-cfca-4c9b-9f87-f86ac0d9a859	b658952b-d52d-4e7a-846d-552b4f9abb3f	progress_updated	0	PLUDwpEzHYYLs6I6jA_USsP3UWfS7EKCf2	2026-04-21 19:40:06.000053+05:30	1	0	1
46	5ea9d9ff-cfca-4c9b-9f87-f86ac0d9a859	b658952b-d52d-4e7a-846d-552b4f9abb3f	progress_updated	0	PLUDwpEzHYYLs6I6jA_USsP3UWfS7EKCf2	2026-04-21 19:40:10.681337+05:30	1	0	1
47	5ea9d9ff-cfca-4c9b-9f87-f86ac0d9a859	b658952b-d52d-4e7a-846d-552b4f9abb3f	progress_updated	0	PLUDwpEzHYYLs6I6jA_USsP3UWfS7EKCf2	2026-04-21 20:25:23.377236+05:30	1	0	1
48	5ea9d9ff-cfca-4c9b-9f87-f86ac0d9a859	b658952b-d52d-4e7a-846d-552b4f9abb3f	progress_updated	0	PLUDwpEzHYYLs6I6jA_USsP3UWfS7EKCf2	2026-04-21 20:25:28.277863+05:30	1	0	1
49	5ea9d9ff-cfca-4c9b-9f87-f86ac0d9a859	b658952b-d52d-4e7a-846d-552b4f9abb3f	progress_updated	0	PLUDwpEzHYYLs6I6jA_USsP3UWfS7EKCf2	2026-04-21 20:29:14.413505+05:30	1	0	1
50	5ea9d9ff-cfca-4c9b-9f87-f86ac0d9a859	b658952b-d52d-4e7a-846d-552b4f9abb3f	progress_updated	0	PLUDwpEzHYYLs6I6jA_USsP3UWfS7EKCf2	2026-04-21 20:29:19.416984+05:30	1	0	1
51	5ea9d9ff-cfca-4c9b-9f87-f86ac0d9a859	11111111-1111-4111-a111-111111111111	progress_updated	0	course-1	2026-04-21 20:29:25.85493+05:30	2	0	2
52	5ea9d9ff-cfca-4c9b-9f87-f86ac0d9a859	11111111-1111-4111-a111-111111111111	progress_updated	0	course-1	2026-04-21 20:29:33.498664+05:30	2	0	2
53	5ea9d9ff-cfca-4c9b-9f87-f86ac0d9a859	22222222-2222-4222-a222-222222222222	progress_updated	0	course-3	2026-04-21 20:38:05.347755+05:30	1	0	1
54	5ea9d9ff-cfca-4c9b-9f87-f86ac0d9a859	b658952b-d52d-4e7a-846d-552b4f9abb3f	progress_updated	0	PLUDwpEzHYYLs6I6jA_USsP3UWfS7EKCf2	2026-04-21 20:38:07.548729+05:30	1	0	1
55	5ea9d9ff-cfca-4c9b-9f87-f86ac0d9a859	b658952b-d52d-4e7a-846d-552b4f9abb3f	progress_updated	0	PLUDwpEzHYYLs6I6jA_USsP3UWfS7EKCf2	2026-04-21 20:38:12.499324+05:30	1	0	1
56	5ea9d9ff-cfca-4c9b-9f87-f86ac0d9a859	22222222-2222-4222-a222-222222222222	progress_updated	0	course-3	2026-04-21 20:38:12.660144+05:30	1	0	1
57	5ea9d9ff-cfca-4c9b-9f87-f86ac0d9a859	b658952b-d52d-4e7a-846d-552b4f9abb3f	progress_updated	0	PLUDwpEzHYYLs6I6jA_USsP3UWfS7EKCf2	2026-04-21 20:39:10.135601+05:30	1	0	1
58	5ea9d9ff-cfca-4c9b-9f87-f86ac0d9a859	b658952b-d52d-4e7a-846d-552b4f9abb3f	progress_updated	0	PLUDwpEzHYYLs6I6jA_USsP3UWfS7EKCf2	2026-04-21 20:39:19.15123+05:30	1	0	1
59	5ea9d9ff-cfca-4c9b-9f87-f86ac0d9a859	b658952b-d52d-4e7a-846d-552b4f9abb3f	progress_updated	0	PLUDwpEzHYYLs6I6jA_USsP3UWfS7EKCf2	2026-04-21 20:39:48.36649+05:30	1	0	1
60	5ea9d9ff-cfca-4c9b-9f87-f86ac0d9a859	b658952b-d52d-4e7a-846d-552b4f9abb3f	progress_updated	0	PLUDwpEzHYYLs6I6jA_USsP3UWfS7EKCf2	2026-04-21 20:39:53.143531+05:30	1	0	1
61	5ea9d9ff-cfca-4c9b-9f87-f86ac0d9a859	b658952b-d52d-4e7a-846d-552b4f9abb3f	progress_updated	0	PLUDwpEzHYYLs6I6jA_USsP3UWfS7EKCf2	2026-04-21 20:40:11.534022+05:30	1	0	1
62	5ea9d9ff-cfca-4c9b-9f87-f86ac0d9a859	b658952b-d52d-4e7a-846d-552b4f9abb3f	progress_updated	0	PLUDwpEzHYYLs6I6jA_USsP3UWfS7EKCf2	2026-04-21 20:40:16.301952+05:30	1	0	1
63	5ea9d9ff-cfca-4c9b-9f87-f86ac0d9a859	b658952b-d52d-4e7a-846d-552b4f9abb3f	progress_updated	0	PLUDwpEzHYYLs6I6jA_USsP3UWfS7EKCf2	2026-04-21 20:40:26.39765+05:30	1	0	1
64	5ea9d9ff-cfca-4c9b-9f87-f86ac0d9a859	b658952b-d52d-4e7a-846d-552b4f9abb3f	progress_updated	0	PLUDwpEzHYYLs6I6jA_USsP3UWfS7EKCf2	2026-04-21 20:40:31.275921+05:30	1	0	1
65	5ea9d9ff-cfca-4c9b-9f87-f86ac0d9a859	b658952b-d52d-4e7a-846d-552b4f9abb3f	progress_updated	14.29	\N	2026-04-21 20:45:36.563365+05:30	1	0	1
66	5ea9d9ff-cfca-4c9b-9f87-f86ac0d9a859	b658952b-d52d-4e7a-846d-552b4f9abb3f	progress_updated	14.29	\N	2026-04-21 20:45:41.657358+05:30	1	0	1
67	5ea9d9ff-cfca-4c9b-9f87-f86ac0d9a859	b658952b-d52d-4e7a-846d-552b4f9abb3f	progress_updated	14.29	\N	2026-04-21 20:46:01.351808+05:30	1	0	1
68	5ea9d9ff-cfca-4c9b-9f87-f86ac0d9a859	b658952b-d52d-4e7a-846d-552b4f9abb3f	progress_updated	14.29	\N	2026-04-21 20:46:06.132459+05:30	1	0	1
69	5ea9d9ff-cfca-4c9b-9f87-f86ac0d9a859	b658952b-d52d-4e7a-846d-552b4f9abb3f	progress_updated	14.29	\N	2026-04-21 20:47:59.578219+05:30	1	0	1
70	5ea9d9ff-cfca-4c9b-9f87-f86ac0d9a859	b658952b-d52d-4e7a-846d-552b4f9abb3f	progress_updated	14.29	\N	2026-04-21 20:48:04.748374+05:30	1	0	1
71	5ea9d9ff-cfca-4c9b-9f87-f86ac0d9a859	b658952b-d52d-4e7a-846d-552b4f9abb3f	progress_updated	14.29	\N	2026-04-21 20:48:26.800899+05:30	1	0	1
72	5ea9d9ff-cfca-4c9b-9f87-f86ac0d9a859	b658952b-d52d-4e7a-846d-552b4f9abb3f	progress_updated	14.29	\N	2026-04-21 20:48:31.601947+05:30	1	0	1
73	5ea9d9ff-cfca-4c9b-9f87-f86ac0d9a859	b658952b-d52d-4e7a-846d-552b4f9abb3f	progress_updated	14.29	\N	2026-04-21 20:49:11.690279+05:30	1	0	1
74	5ea9d9ff-cfca-4c9b-9f87-f86ac0d9a859	b658952b-d52d-4e7a-846d-552b4f9abb3f	progress_updated	14.29	\N	2026-04-21 20:49:16.487459+05:30	1	0	1
75	5ea9d9ff-cfca-4c9b-9f87-f86ac0d9a859	b658952b-d52d-4e7a-846d-552b4f9abb3f	progress_updated	14.29	\N	2026-04-21 20:49:21.986866+05:30	1	0	1
76	5ea9d9ff-cfca-4c9b-9f87-f86ac0d9a859	b658952b-d52d-4e7a-846d-552b4f9abb3f	progress_updated	14.29	\N	2026-04-21 20:49:26.733949+05:30	1	0	1
77	5ea9d9ff-cfca-4c9b-9f87-f86ac0d9a859	b658952b-d52d-4e7a-846d-552b4f9abb3f	progress_updated	14.29	\N	2026-04-21 20:50:41.001554+05:30	1	0	1
78	5ea9d9ff-cfca-4c9b-9f87-f86ac0d9a859	b658952b-d52d-4e7a-846d-552b4f9abb3f	progress_updated	14.29	\N	2026-04-21 20:50:41.24553+05:30	1	0	1
79	5ea9d9ff-cfca-4c9b-9f87-f86ac0d9a859	b658952b-d52d-4e7a-846d-552b4f9abb3f	progress_updated	14.29	\N	2026-04-21 20:50:45.970758+05:30	1	0	1
80	5ea9d9ff-cfca-4c9b-9f87-f86ac0d9a859	b658952b-d52d-4e7a-846d-552b4f9abb3f	progress_updated	14.29	\N	2026-04-21 20:50:46.258741+05:30	1	0	1
81	5ea9d9ff-cfca-4c9b-9f87-f86ac0d9a859	b658952b-d52d-4e7a-846d-552b4f9abb3f	progress_updated	14.29	\N	2026-04-21 20:54:08.694547+05:30	1	0	1
82	5ea9d9ff-cfca-4c9b-9f87-f86ac0d9a859	b658952b-d52d-4e7a-846d-552b4f9abb3f	progress_updated	14.29	\N	2026-04-21 20:54:14.156759+05:30	1	0	1
83	5ea9d9ff-cfca-4c9b-9f87-f86ac0d9a859	b658952b-d52d-4e7a-846d-552b4f9abb3f	progress_updated	14.29	\N	2026-04-21 20:59:11.981714+05:30	1	0	1
84	5ea9d9ff-cfca-4c9b-9f87-f86ac0d9a859	b658952b-d52d-4e7a-846d-552b4f9abb3f	progress_updated	14.29	\N	2026-04-21 20:59:54.479869+05:30	1	0	1
85	5ea9d9ff-cfca-4c9b-9f87-f86ac0d9a859	b658952b-d52d-4e7a-846d-552b4f9abb3f	progress_updated	14.29	\N	2026-04-21 20:59:59.765875+05:30	1	0	1
86	5ea9d9ff-cfca-4c9b-9f87-f86ac0d9a859	b658952b-d52d-4e7a-846d-552b4f9abb3f	progress_updated	14.29	\N	2026-04-21 21:00:28.969182+05:30	1	0	1
87	5ea9d9ff-cfca-4c9b-9f87-f86ac0d9a859	b658952b-d52d-4e7a-846d-552b4f9abb3f	progress_updated	14.29	\N	2026-04-21 21:00:34.489848+05:30	1	0	1
88	5ea9d9ff-cfca-4c9b-9f87-f86ac0d9a859	b658952b-d52d-4e7a-846d-552b4f9abb3f	progress_updated	57.14	\N	2026-04-21 21:04:13.358282+05:30	1	0	1
89	5ea9d9ff-cfca-4c9b-9f87-f86ac0d9a859	b658952b-d52d-4e7a-846d-552b4f9abb3f	progress_updated	57.14	\N	2026-04-21 21:04:18.46302+05:30	1	0	1
90	5ea9d9ff-cfca-4c9b-9f87-f86ac0d9a859	b658952b-d52d-4e7a-846d-552b4f9abb3f	progress_updated	57.14	\N	2026-04-21 21:04:41.883545+05:30	1	0	1
91	5ea9d9ff-cfca-4c9b-9f87-f86ac0d9a859	b658952b-d52d-4e7a-846d-552b4f9abb3f	progress_updated	57.14	\N	2026-04-21 21:04:46.814671+05:30	1	0	1
92	5ea9d9ff-cfca-4c9b-9f87-f86ac0d9a859	11111111-1111-4111-a111-111111111111	progress_updated	0	\N	2026-04-21 21:05:16.101504+05:30	2	0	2
93	5ea9d9ff-cfca-4c9b-9f87-f86ac0d9a859	11111111-1111-4111-a111-111111111111	progress_updated	0	\N	2026-04-21 21:05:23.980781+05:30	2	0	2
94	5ea9d9ff-cfca-4c9b-9f87-f86ac0d9a859	b658952b-d52d-4e7a-846d-552b4f9abb3f	progress_updated	57.14	\N	2026-04-22 08:20:15.794475+05:30	1	0	1
95	5ea9d9ff-cfca-4c9b-9f87-f86ac0d9a859	b658952b-d52d-4e7a-846d-552b4f9abb3f	progress_updated	57.14	\N	2026-04-22 09:36:49.154592+05:30	1	0	1
96	5ea9d9ff-cfca-4c9b-9f87-f86ac0d9a859	b658952b-d52d-4e7a-846d-552b4f9abb3f	progress_updated	57.14	\N	2026-04-22 09:38:23.960672+05:30	1	0	1
97	5ea9d9ff-cfca-4c9b-9f87-f86ac0d9a859	b658952b-d52d-4e7a-846d-552b4f9abb3f	progress_updated	57.14	\N	2026-04-22 09:55:01.044344+05:30	1	0	1
\.


--
-- Data for Name: learning_paths; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.learning_paths (path_id, title, description, editor_name, total_views, average_completion_rate, rating) FROM stdin;
11111111-1111-4111-a111-111111111111	Frontend Development	Complete roadmap to becoming a frontend master.	Hexaware Admin	2500	0	4.8
22222222-2222-4222-a222-222222222222	Python Developer	Zero to hero Python syllabus.	Hexaware Admin	1800	0	4.7
b658952b-d52d-4e7a-846d-552b4f9abb3f	Mastering Python Backend	A comprehensive journey from basic Python to advanced FastAPI services.	Hexaware Admin	0	0	5
\.


--
-- Data for Name: path_enrollments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.path_enrollments (id, user_id, path_id, enrolled_at) FROM stdin;
1	5ea9d9ff-cfca-4c9b-9f87-f86ac0d9a859	11111111-1111-4111-a111-111111111111	2026-04-21 16:35:11.385624+05:30
2	5ea9d9ff-cfca-4c9b-9f87-f86ac0d9a859	22222222-2222-4222-a222-222222222222	2026-04-21 16:35:11.385624+05:30
27	5ea9d9ff-cfca-4c9b-9f87-f86ac0d9a859	b658952b-d52d-4e7a-846d-552b4f9abb3f	2026-04-21 18:01:11.795671+05:30
\.


--
-- Data for Name: path_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.path_items (id, path_id, playlist_id, sequence_order) FROM stdin;
1	11111111-1111-4111-a111-111111111111	course-1	1
2	11111111-1111-4111-a111-111111111111	course-2	2
3	22222222-2222-4222-a222-222222222222	course-3	1
9	b658952b-d52d-4e7a-846d-552b4f9abb3f	PLUDwpEzHYYLs6I6jA_USsP3UWfS7EKCf2	1
\.


--
-- Name: learning_history_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.learning_history_id_seq', 97, true);


--
-- Name: path_enrollments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.path_enrollments_id_seq', 29, true);


--
-- Name: path_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.path_items_id_seq', 9, true);


--
-- Name: learning_history learning_history_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.learning_history
    ADD CONSTRAINT learning_history_pkey PRIMARY KEY (id);


--
-- Name: learning_paths learning_paths_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.learning_paths
    ADD CONSTRAINT learning_paths_pkey PRIMARY KEY (path_id);


--
-- Name: path_enrollments path_enrollments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.path_enrollments
    ADD CONSTRAINT path_enrollments_pkey PRIMARY KEY (id);


--
-- Name: path_items path_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.path_items
    ADD CONSTRAINT path_items_pkey PRIMARY KEY (id);


--
-- Name: path_enrollments uq_path_enrollments_user_path; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.path_enrollments
    ADD CONSTRAINT uq_path_enrollments_user_path UNIQUE (user_id, path_id);


--
-- Name: path_items uq_path_items_path_order; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.path_items
    ADD CONSTRAINT uq_path_items_path_order UNIQUE (path_id, sequence_order);


--
-- Name: path_items uq_path_items_path_playlist; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.path_items
    ADD CONSTRAINT uq_path_items_path_playlist UNIQUE (path_id, playlist_id);


--
-- Name: ix_learning_history_path_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_learning_history_path_id ON public.learning_history USING btree (path_id);


--
-- Name: ix_learning_history_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_learning_history_user_id ON public.learning_history USING btree (user_id);


--
-- Name: ix_learning_paths_title; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_learning_paths_title ON public.learning_paths USING btree (title);


--
-- Name: ix_path_enrollments_path_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_path_enrollments_path_id ON public.path_enrollments USING btree (path_id);


--
-- Name: ix_path_enrollments_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_path_enrollments_user_id ON public.path_enrollments USING btree (user_id);


--
-- Name: ix_path_items_path_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ix_path_items_path_id ON public.path_items USING btree (path_id);


--
-- Name: learning_history learning_history_path_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.learning_history
    ADD CONSTRAINT learning_history_path_id_fkey FOREIGN KEY (path_id) REFERENCES public.learning_paths(path_id) ON DELETE CASCADE;


--
-- Name: path_enrollments path_enrollments_path_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.path_enrollments
    ADD CONSTRAINT path_enrollments_path_id_fkey FOREIGN KEY (path_id) REFERENCES public.learning_paths(path_id) ON DELETE CASCADE;


--
-- Name: path_items path_items_path_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.path_items
    ADD CONSTRAINT path_items_path_id_fkey FOREIGN KEY (path_id) REFERENCES public.learning_paths(path_id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict sYuTANoVkNjUY47qO4q3cT9uDgLcrV859byFcMch8uGWTZl9QJ7p3ZYMaOL4KgK

