// Simple JS for navigation or API calls can go here

console.log('Resume Builder loaded');

// Example: Call backend AI resume auto-generation
async function autoGenerateResume(token) {
	try {
		const res = await fetch('http://localhost:5000/api/resume/auto-generate', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': 'Bearer ' + token
			}
		});
		const data = await res.json();
		if (data.content) {
			// Display the generated resume content (for demo, log to console)
			console.log('AI Resume:', data.content);
			alert('AI Resume generated! Check console for details.');
			// You can render this data in the DOM as needed
		} else {
			alert('Failed to generate resume: ' + (data.error || 'Unknown error'));
		}
	} catch (err) {
		alert('Error: ' + err.message);
	}
}

// Example usage: autoGenerateResume('YOUR_JWT_TOKEN_HERE');