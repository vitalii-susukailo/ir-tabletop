# Mareld Labs - IR Tabletop tool

Mareld Labs is a web-based cybersecurity incident response exercise platform built as a microservice application and deployed in Kubernetes.

## 1. Application

The current version of the exercise simulates a phishing attack delivered through a legitimate DocuSign email containing a malicious QR code.

The participant completes three sequential incident-response decisions. Each step presents a situation and three possible actions. Correct decisions receive points and an explanation.

Each step can only be answered once. The server controls the current step, while session progress and scores are stored in MongoDB. 

## 2. Architecture

```text
Browser
   |
   v
NGINX Ingress
   |
   v
session-service
   |        \
   v         v
scenario   MongoDB
 service      |
              v
             PVC
```

| Component          | Responsibility                                         |
| ------------------ | ------------------------------------------------------ |
| `scenario-service` | Scenario content, choices, correct answers and scoring |
| `session-service`  | Sessions, current step, answers, score and frontend    |
| `mongodb`          | Persistent session state                               |
| NGINX Ingress      | External entry point                                   |

Only `session-service` is exposed externally. `scenario-service` and MongoDB remain internal to the Kubernetes cluster. 

The main architecture patterns are:

* **Stateless services** — application state is stored outside the service processes.
* **Database per service** — only `session-service` accesses MongoDB.
* **Service discovery** — Kubernetes DNS provides `scenario:8000` and `mongodb:27017`.
* **Externalised configuration** — service addresses are environment variables.
* **Ingress / edge routing** — the browser has a single entry point.
* **Health probes** — Kubernetes checks `/health`.
* **Declarative deployment** — Kubernetes resources are defined as YAML. 

The frontend is served by `session-service` rather than deployed as another microservice because it is specific to this application and using the same origin avoids unnecessary CORS configuration. 

## 3. Scalability and Security

`scenario-service` and `session-service` can scale independently using separate HPAs. Both are stateless, while MongoDB provides persistent state. 

The main security decisions are:

* correct answers remain inside `scenario-service`;
* `GET /steps/{id}` explicitly returns only public fields;
* `scenario-service` is not exposed through Ingress;
* the client sends only the selected answer, while the server determines the current step.

This prevents clients from directly retrieving correct answers or repeatedly submitting the same step to increase their score. 

Current limitations include no authentication, no TLS, unauthenticated MongoDB, no `NetworkPolicy`, no database backups and no external secrets management. 

## 4. Deployment

The Kubernetes deployment contains:

```text
2 x session-service pods
2 x scenario-service pods
1 x MongoDB StatefulSet
1 x Persistent Volume
1 x NGINX Ingress
2 x Horizontal Pod Autoscalers
```

The application is accessible at:

```text
http://tabletop.localhost
```


# Future Development Plan

The current version is intentionally simple and decision-based. The next version should evolve toward a **Tactical Decision Game** structure rather than only presenting a sequence of multiple-choice incident-response questions.

### Phase 1 — Richer decision flow

Extend each exercise from the current three decisions into the following stages:

```text

1. Define short-term goals
2. Define long-term goals

3. Select actions for short-term goals
4. Select actions for long-term goals
```

The current `scenario-service` can support this without a major architecture change. Scenario content could be generated with AI integration.


### Phase 2 — Expert decision comparison

After the participant makes a decision, the application should show the approach taken by a domain expert. --> Those can be gathered by the interviews for each scenario.

The participant would then see:

```text
Your decision
        ↓
Expert decision
        ↓
Reasoning / differences
```

This would move the exercise from a simple quiz toward reflective decision training.

### Phase 3 — AI-supported scenario generation

AI would be added **after** the expert comparison.

The AI could be used to generare scenario.

```text
Current:
1 Scenario → Choice → Score → Explanation

Future:
5 propose scenarios + AI genrated scenario → Choice for short term goal (for proposed scenarios experts would provide their response) → Choice for long term goal (for proposed scenarios experts would provide their reflection) → Score → Explanation
```
