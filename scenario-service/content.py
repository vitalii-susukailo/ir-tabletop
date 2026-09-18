steps = [
    {
        "id": 1,
        "situation": (
            "An employee receives an unexpected DocuSign email. "
            "The email was genuinely sent through DocuSign and asks the employee "
            "to review a document. After opening the document, the employee sees "
            "a QR code with instructions to scan it using a mobile phone to verify identity."
        ),
        "options": {
            "A": "Scan the QR code because the email was sent by DocuSign",
            "B": "Do not scan the QR code, verify whether the document was expected, and report it to the security team",
            "C": "Forward the DocuSign email to a colleague and ask them to test the QR code"
        },
        "correct_choice": "B",
        "points": 10,
        "explanation": (
            "A legitimate DocuSign email does not automatically mean the content is safe. "
            "Attackers can abuse legitimate services to deliver malicious documents. "
            "An unexpected QR code should be treated as suspicious and verified through another trusted channel."
        )
    },
    {
        "id": 2,
        "situation": (
            "The employee reports the message. The security team confirms that several "
            "employees received the same DocuSign document. The QR code leads to a webpage "
            "that looks like a Microsoft 365 login page."
        ),
        "options": {
            "A": "Warn users, block the malicious URL, preserve the email and document, and investigate who interacted with it",
            "B": "Delete the emails from affected mailboxes and close the incident",
            "C": "Block all emails from DocuSign"
        },
        "correct_choice": "A",
        "points": 10,
        "explanation": (
            "The security team should contain the incident while preserving evidence. "
            "They should identify users who interacted with the QR code, block the malicious destination, "
            "and determine whether any credentials were entered."
        )
    },
    {
        "id": 3,
        "situation": (
            "One employee confirms that they scanned the QR code and entered their "
            "Microsoft 365 username and password. The fake login page then displayed an error."
        ),
        "options": {
            "A": "Ask the employee to change their password later",
            "B": "Reset the password and close the incident",
            "C": "Reset the password immediately, revoke active sessions, review sign-in activity, and investigate the account"
        },
        "correct_choice": "C",
        "points": 10,
        "explanation": (
            "The credentials should be treated as compromised. "
            "Resetting the password alone may not invalidate existing authenticated sessions, "
            "so active sessions should also be revoked and recent account activity reviewed."
        )
    }
]