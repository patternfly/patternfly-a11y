async function runAxe(context, options) {
  console.log(context);
  console.log(`window.axe: ${window.axe}`);
  const results = await window.axe.run(eval(context), options);

  const targetHasIgnoredRule = (target, ruleId) => {
    if (!Array.isArray(target)) {
      return false;
    }

    // Axe targets can describe a path through frames and shadow roots.
    let roots = [document];
    let elements = [];
    for (let index = 0; index < target.length; index++) {
      const segment = target[index];
      const selectors = Array.isArray(segment) ? segment : [segment];
      const isLastTarget = index === target.length - 1;

      for (let selectorIndex = 0; selectorIndex < selectors.length; selectorIndex++) {
        const selector = selectors[selectorIndex];
        const isLastSelector = selectorIndex === selectors.length - 1;
        elements = roots.flatMap((root) => {
          try {
            return Array.from(root.querySelectorAll(selector));
          } catch {
            return [];
          }
        });

        if (!isLastSelector) {
          roots = elements.map((element) => element.shadowRoot).filter(Boolean);
        }
      }

      if (!isLastTarget) {
        roots = elements
          .map((element) => {
            try {
              return element.contentDocument;
            } catch {
              return null;
            }
          })
          .filter(Boolean);
      }
    }

    return elements.some((element) =>
      (element.getAttribute("data-a11y-ignore") || "")
        .split(",")
        .map((rule) => rule.trim())
        .includes(ruleId)
    );
  };

  const filterIgnoredNodes = (resultsForRules) => {
    if (!Array.isArray(resultsForRules)) {
      return [];
    }

    resultsForRules.forEach((result) => {
      result.nodes = (result.nodes || []).filter(
        (node) => !targetHasIgnoredRule(node.target, result.id)
      );
    });
    return resultsForRules.filter((result) => result.nodes.length > 0);
  };

  results.violations = filterIgnoredNodes(results.violations);
  results.incomplete = filterIgnoredNodes(results.incomplete);
  return results;
}

module.exports = { runAxe };
