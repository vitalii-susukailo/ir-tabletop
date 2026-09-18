Mareld Lab Game

A simple microservices-based incident response exercise built with FastAPI.

The scenario simulates a DocuSign phishing attack where a legitimate DocuSign email contains a document with a malicious QR code.

Architecture

Browser
   |
   v
Session Service :8002
   |
   v
Scenario Service :8001
